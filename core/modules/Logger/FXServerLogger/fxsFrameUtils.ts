import {
    buildFxsFramePrefix,
    FRAME_FXS,
    FRAME_SEP,
    FXS_LOG_LEVELS,
    FXS_RAW_HEADER_MAX_LENGTH,
    FXS_RAW_HEADER_SEPS,
    parseFxsRawFrameHeader,
    renderFxsChannelBracket,
} from '@shared/consoleFrames';

const ANSI_RESET = '\x1b[0m';


/**
 * Holds back a partial fxserver frame header at the end of a chunk, so it can be
 * completed by the next chunk. Node delivers pipe data at arbitrary boundaries,
 * so a header can be split in two.
 * This operates on the raw frames as written by fxserver (no timestamp yet).
 */
export class FrameChunkAssembler {
    private pending = '';

    public reset() {
        this.pending = '';
    }

    /**
     * Returns the chunk to process, possibly with data from the previous call prepended,
     * and possibly with a partial header at the end removed (kept for the next call).
     */
    public feed(chunk: string): string {
        if (this.pending) {
            chunk = this.pending + chunk;
            this.pending = '';
        }
        const lastRs = chunk.lastIndexOf(FRAME_FXS);
        if (lastRs === -1) return chunk;
        //if the tail is longer than a header could be, it's complete or not a header
        if (chunk.length - lastRs > FXS_RAW_HEADER_MAX_LENGTH) return chunk;
        //headers cannot contain line breaks, so this is not a partial header
        if (chunk.indexOf('\n', lastRs) !== -1) return chunk;

        //check if the header is complete
        let sepsFound = 0;
        let cursor = lastRs;
        while (sepsFound < FXS_RAW_HEADER_SEPS) {
            cursor = chunk.indexOf(FRAME_SEP, cursor + 1);
            if (cursor === -1) break;
            sepsFound++;
        }
        if (sepsFound === FXS_RAW_HEADER_SEPS) return chunk;

        this.pending = chunk.substring(lastRs);
        return chunk.substring(0, lastRs);
    }
}


/**
 * Removes unit separators that are not part of a header (eg. printed by a resource).
 */
const stripStraySeps = (str: string) => {
    return str.includes(FRAME_SEP) ? str.replaceAll(FRAME_SEP, '') : str;
}


/**
 * Processes a chunk of framed fxserver output in a single pass, producing:
 * - web: the frames with the timestamp injected after every valid header
 *        `\x1e<ts>\x1f<level>\x1f<color>\x1f<channel>\x1f<body>`
 * - stdout: the human-readable format, for the host terminal and the log file
 *        `<levelColor>[HH:MM:SS]<reset> <channelColor>[<channel>]<reset> <body>`
 *        NOTE: this is the gen9 format minus the `[<level>]` bracket, the level color is kept on the timestamp
 * Text without a valid header (continuation lines) is passed through to both.
 * Separators that are not part of a valid header are removed from both.
 */
export class FramedChunkProcessor {
    private readonly levelOpen: string[];
    private readonly levelClose: string[];
    private readonly channelCache = new Map<string, string>();
    private readonly channelCacheMax = 512;
    private lastTsHex = '';
    private lastTsStr = '';
    private lastFramePrefix = '';

    constructor() {
        this.levelOpen = FXS_LOG_LEVELS.map((lvl) => lvl.ansi + '[');
        this.levelClose = FXS_LOG_LEVELS.map(() => `]${ANSI_RESET} `);
    }

    public reset() {
        this.channelCache.clear();
        this.lastTsHex = '';
        this.lastTsStr = '';
        this.lastFramePrefix = '';
    }

    private refreshTs(tsHex: string) {
        if (tsHex === this.lastTsHex) return;
        const date = new Date(parseInt(tsHex, 16) * 1000);
        this.lastTsStr = date.getHours().toString().padStart(2, '0')
            + ':' + date.getMinutes().toString().padStart(2, '0')
            + ':' + date.getSeconds().toString().padStart(2, '0');
        this.lastFramePrefix = buildFxsFramePrefix(tsHex);
        this.lastTsHex = tsHex;
    }

    private getChannelPrefix(color: string, channel: string) {
        const key = color + FRAME_SEP + channel;
        let prefix = this.channelCache.get(key);
        if (prefix === undefined) {
            const bracket = renderFxsChannelBracket(channel);
            prefix = color
                ? `\x1b[38;5;${color}m${bracket}${ANSI_RESET} `
                : `${bracket} `;
            if (this.channelCache.size >= this.channelCacheMax) this.channelCache.clear();
            this.channelCache.set(key, prefix);
        }
        return prefix;
    }

    public process(data: string, tsHex: string): { web: string, stdout: string } {
        let rs = data.indexOf(FRAME_FXS);
        if (rs === -1) {
            const clean = stripStraySeps(data);
            return { web: clean, stdout: clean };
        }
        this.refreshTs(tsHex);

        let web = '';
        let stdout = '';
        let pos = 0;
        while (rs !== -1) {
            if (rs > pos) {
                const segment = stripStraySeps(data.substring(pos, rs));
                web += segment;
                stdout += segment;
            }
            const header = parseFxsRawFrameHeader(data, rs);
            if (header) {
                web += this.lastFramePrefix + data.substring(rs + 1, header.bodyStart);
                stdout += this.levelOpen[header.level]
                    + this.lastTsStr
                    + this.levelClose[header.level]
                    + this.getChannelPrefix(header.color, header.channel);
                pos = header.bodyStart;
            } else {
                //not a header, drop the control char
                pos = rs + 1;
            }
            rs = data.indexOf(FRAME_FXS, pos);
        }
        const tail = stripStraySeps(data.substring(pos));
        return { web: web + tail, stdout: stdout + tail };
    }
}
