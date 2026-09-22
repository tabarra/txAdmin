/**
 * Live console line framing protocol, shared between core (producer) and panel (consumer).
 *
 * Every line sent to the live console starts with a header. There are two header shapes,
 * distinguished by their first byte:
 *
 * FXServer lines (gen9 output framing, header written by fxserver, timestamp injected by txAdmin):
 *   \x1e<ts>\x1f<level>\x1f<color>\x1f<channel>\x1f<body>
 *   - ts:      8 hex chars, unix seconds
 *   - level:   single digit, spdlog level (0 trace .. 5 critical)
 *   - color:   0-3 decimal digits, ansi256 color index for the channel (may be empty)
 *   - channel: 1-64 chars, not truncated
 *
 * txAdmin lines (markers, admin/system commands, stderr, and legacy unframed stdout):
 *   \x1d<ts>\x1f<kind>\x1f<context>\x1f<body>
 *   - kind:    single letter, see TxLineKind
 *   - context: admin name for admin commands, empty otherwise
 *   - body:    already rendered (prefix + colors), print as is
 *
 * The \x1d byte is stripped from all fxserver output by the core, so a txAdmin header can never
 * be forged by a resource. The \x1e/\x1f bytes are only let through when framing is detected.
 */

export const FRAME_FXS = '\x1e'; //record separator
export const FRAME_TX = '\x1d'; //group separator
export const FRAME_SEP = '\x1f'; //unit separator
export const FRAME_FXS_CODE = 0x1e;
export const FRAME_TX_CODE = 0x1d;
export const FRAME_SEP_CODE = 0x1f;

export const FRAME_TS_LENGTH = 8;
export const FRAME_CHANNEL_MAX_LENGTH = 64;
export const FRAME_CONTEXT_MAX_LENGTH = 64;
export const FRAME_COLOR_MAX_LENGTH = 3;

//Max length of an fxserver header as written by fxserver (no timestamp): RS + level + 3 seps + color + channel
export const FXS_RAW_HEADER_MAX_LENGTH = 1 + 1 + 3 + FRAME_COLOR_MAX_LENGTH + FRAME_CHANNEL_MAX_LENGTH;
//Number of separators that complete an fxserver header as written by fxserver
export const FXS_RAW_HEADER_SEPS = 3;


/**
 * spdlog levels, indexed by the digit in the frame.
 * NOTE: names and colors for debug/info/error were captured from a real gen9 build.
 * The trace/warn/critical entries are placeholders until confirmed.
 */
export type FxsLogLevelId = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type FxsLogLevel = {
    id: FxsLogLevelId;
    label: string; //5 chars, right-aligned, as printed by fxserver
    ansi: string;
};
export const FXS_LOG_LEVELS: readonly FxsLogLevel[] = [
    { id: 'trace', label: 'trace', ansi: '\x1b[90m' },
    { id: 'debug', label: 'debug', ansi: '\x1b[36m' },
    { id: 'info', label: ' info', ansi: '\x1b[32m' },
    { id: 'warn', label: ' warn', ansi: '\x1b[33m' },
    { id: 'error', label: 'error', ansi: '\x1b[91m' },
    { id: 'critical', label: ' crit', ansi: '\x1b[1;91m' },
];

/**
 * txAdmin line kinds
 */
export const TxLineKind = {
    AdminCmd: 'A',
    SystemCmd: 'S',
    Info: 'I',
    StdErr: 'E',
    LegacyStdOut: 'L', //unframed fxserver stdout (gen8 or framing not detected)
} as const;
export type TxLineKindChar = typeof TxLineKind[keyof typeof TxLineKind];
const VALID_TX_KINDS = new Set<string>(Object.values(TxLineKind));


//Types
export type FxsFrameHeader = {
    type: 'fxs';
    tsHex: string;
    level: number;
    color: string;
    channel: string;
    bodyStart: number;
};
export type TxFrameHeader = {
    type: 'tx';
    tsHex: string;
    kind: TxLineKindChar;
    context: string;
    bodyStart: number;
};
export type FrameHeader = FxsFrameHeader | TxFrameHeader;


const isHex8 = (str: string, start: number) => {
    for (let i = start; i < start + FRAME_TS_LENGTH; i++) {
        const c = str.charCodeAt(i);
        const isDigit = c >= 48 && c <= 57;
        const isLowerHex = c >= 97 && c <= 102;
        if (!isDigit && !isLowerHex) return false;
    }
    return true;
}

const isDigits = (str: string, start: number, end: number) => {
    for (let i = start; i < end; i++) {
        const c = str.charCodeAt(i);
        if (c < 48 || c > 57) return false;
    }
    return true;
}


/**
 * Parses the level/color/channel fields of an fxserver header, starting at the level digit.
 * Format: <level:digit>\x1f<color:0-3 digits>\x1f<channel:1-64>\x1f
 */
type FxsFrameFields = Pick<FxsFrameHeader, 'level' | 'color' | 'channel' | 'bodyStart'>;
const parseFxsFrameFields = (str: string, levelPos: number): FxsFrameFields | null => {
    const level = str.charCodeAt(levelPos) - 48;
    if (!(level >= 0 && level < FXS_LOG_LEVELS.length)) return null; //NaN safe
    if (str.charCodeAt(levelPos + 1) !== FRAME_SEP_CODE) return null;

    const colorStart = levelPos + 2;
    const colorEnd = str.indexOf(FRAME_SEP, colorStart);
    if (colorEnd === -1 || colorEnd - colorStart > FRAME_COLOR_MAX_LENGTH) return null;
    if (!isDigits(str, colorStart, colorEnd)) return null;

    const channelStart = colorEnd + 1;
    const channelEnd = str.indexOf(FRAME_SEP, channelStart);
    if (channelEnd === -1) return null;
    const channelLength = channelEnd - channelStart;
    if (channelLength < 1 || channelLength > FRAME_CHANNEL_MAX_LENGTH) return null;
    const channel = str.substring(channelStart, channelEnd);
    if (channel.includes('\n') || channel.includes(FRAME_FXS)) return null;

    return {
        level,
        color: str.substring(colorStart, colorEnd),
        channel,
        bodyStart: channelEnd + 1,
    };
}


/**
 * Parses an fxserver frame header starting at `start` (which must point to the \x1e byte).
 * Returns null if the header is not valid, in which case the caller should treat the byte as noise.
 * Format: \x1e<ts:8hex>\x1f<level:digit>\x1f<color:0-3 digits>\x1f<channel:1-64>\x1f
 */
export const parseFxsFrameHeader = (str: string, start = 0): FxsFrameHeader | null => {
    if (str.charCodeAt(start) !== FRAME_FXS_CODE) return null;
    const tsStart = start + 1;
    const tsEnd = tsStart + FRAME_TS_LENGTH;
    if (str.charCodeAt(tsEnd) !== FRAME_SEP_CODE) return null;
    if (!isHex8(str, tsStart)) return null;

    const fields = parseFxsFrameFields(str, tsEnd + 1);
    if (!fields) return null;
    return {
        type: 'fxs',
        tsHex: str.substring(tsStart, tsEnd),
        ...fields,
    };
}


/**
 * Parses an fxserver frame header as written by fxserver, before txAdmin injects the timestamp.
 * Format: \x1e<level:digit>\x1f<color:0-3 digits>\x1f<channel:1-64>\x1f
 */
export type FxsRawFrameHeader = FxsFrameFields;
export const parseFxsRawFrameHeader = (str: string, start = 0): FxsRawFrameHeader | null => {
    if (str.charCodeAt(start) !== FRAME_FXS_CODE) return null;
    return parseFxsFrameFields(str, start + 1);
}


/**
 * Parses a txAdmin frame header starting at `start` (which must point to the \x1d byte).
 * Format: \x1d<ts:8hex>\x1f<kind:letter>\x1f<context>\x1f
 */
export const parseTxFrameHeader = (str: string, start = 0): TxFrameHeader | null => {
    if (str.charCodeAt(start) !== FRAME_TX_CODE) return null;
    const tsStart = start + 1;
    const tsEnd = tsStart + FRAME_TS_LENGTH;
    if (str.charCodeAt(tsEnd) !== FRAME_SEP_CODE) return null;
    if (!isHex8(str, tsStart)) return null;

    const kind = str[tsEnd + 1];
    if (!kind || !VALID_TX_KINDS.has(kind)) return null;
    if (str.charCodeAt(tsEnd + 2) !== FRAME_SEP_CODE) return null;

    const contextStart = tsEnd + 3;
    const contextEnd = str.indexOf(FRAME_SEP, contextStart);
    if (contextEnd === -1 || contextEnd - contextStart > FRAME_CONTEXT_MAX_LENGTH) return null;
    const context = str.substring(contextStart, contextEnd);
    if (context.includes('\n')) return null;

    return {
        type: 'tx',
        tsHex: str.substring(tsStart, tsEnd),
        kind: kind as TxLineKindChar,
        context,
        bodyStart: contextEnd + 1,
    };
}


/**
 * Parses whichever header (if any) is at the start of a line.
 */
export const parseFrameHeader = (line: string): FrameHeader | null => {
    const first = line.charCodeAt(0);
    if (first === FRAME_FXS_CODE) return parseFxsFrameHeader(line, 0);
    if (first === FRAME_TX_CODE) return parseTxFrameHeader(line, 0);
    return null;
}


/**
 * Builds the txAdmin header for a line.
 * The context must not contain control characters, the caller is responsible for that.
 */
export const buildTxFrameHeader = (tsHex: string, kind: TxLineKindChar, context = '') => {
    return FRAME_TX + tsHex + FRAME_SEP + kind + FRAME_SEP + context + FRAME_SEP;
}


/**
 * Builds the prefix txAdmin injects after every \x1e to add the timestamp to fxserver frames.
 */
export const buildFxsFramePrefix = (tsHex: string) => {
    return FRAME_FXS + tsHex + FRAME_SEP;
}


/**
 * Encodes a unix timestamp (seconds) as the 8 hex chars used in the headers.
 */
export const encodeFrameTs = (tsSeconds: number) => {
    return tsSeconds.toString(16).padStart(FRAME_TS_LENGTH, '0');
}


/**
 * Width of the channel name in the fxserver line prefix, per generation.
 * txAdmin's own line prefixes (`║ TXADMIN║`) use the same width so everything aligns.
 */
export const FXS_CHANNEL_WIDTH_GEN8 = 20;
export const FXS_CHANNEL_WIDTH_GEN9 = 16;
export const FXS_CHANNEL_BRACKET_WIDTH = FXS_CHANNEL_WIDTH_GEN9;

/**
 * Renders the fxserver-style channel bracket, eg. `[ server-launcher]`.
 * Matches gen9: first 16 chars of the channel, right-aligned to 16.
 */
export const renderFxsChannelBracket = (channel: string) => {
    return '[' + channel.slice(0, FXS_CHANNEL_BRACKET_WIDTH).padStart(FXS_CHANNEL_BRACKET_WIDTH, ' ') + ']';
}
