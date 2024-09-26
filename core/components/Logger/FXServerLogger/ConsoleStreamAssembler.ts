const modulename = 'ConsoleStreamAssembler';
import { throttle } from 'throttle-debounce';
import consoleFactory from '@extras/console';
import { ConsoleLineType } from './index';
import chalk from 'chalk';
const console = consoleFactory(modulename);



//Types
type FlushCallbackType = (webBuffer: string, stdoutBuffer: string, fileBuffer: string) => void;

type LastOutputInfoType = {
    src: string;
    type: ConsoleLineType;
    context?: string;
    eol: boolean;
}

type IncomingQueueBlockType = {
    src: string;
    type: ConsoleLineType;
    data: string;
    context?: string;
    delayedSince?: number;
}

type ColorLibrary = {
    [key in ConsoleLineType]: (str: string) => string;
}

//Constants
const WEB_COLORS = {
    [ConsoleLineType.StdOut]: (str) => str,
    [ConsoleLineType.StdErr]: chalk.bgRedBright.bold.black,
    [ConsoleLineType.MarkerAdminCmd]: chalk.bgYellowBright.bold.black,
    [ConsoleLineType.MarkerSystemCmd]: chalk.bgHex('#36383D').bold.hex('#CCCCCC'),
    [ConsoleLineType.MarkerInfo]: chalk.bgBlueBright.bold.black,
} as ColorLibrary;
const STDOUT_COLORS = {
    [ConsoleLineType.StdOut]: (str) => str,
    [ConsoleLineType.StdErr]: chalk.bgRedBright.bold.black,
    [ConsoleLineType.MarkerAdminCmd]: chalk.bgYellowBright.bold.black,
    [ConsoleLineType.MarkerSystemCmd]: chalk.bgHex('#36383D').bold.hex('#CCCCCC'),
    [ConsoleLineType.MarkerInfo]: chalk.bgBlueBright.bold.black,
} as ColorLibrary;

//Max time to wait before breaking a line to output from different sources
const MAX_HOLDOFF_MS = 2500;

//To break any fake marker - using only one char because multichar can be broken by processQueue
const SECT_ZWNBSP = '§\uFEFF';

const getConsoleLinePrefix = (prefix: string) => `[${prefix.padStart(20, ' ')}] `;
const consoleSystemPrefix = getConsoleLinePrefix('TXADMIN');
const consoleStderrPrefix = getConsoleLinePrefix('STDERR');

const getStyledPrefix = (type: ConsoleLineType, context?: string) => {
    let prefix = '';
    if (type === ConsoleLineType.StdErr) {
        prefix = consoleStderrPrefix;
    } else if (type === ConsoleLineType.MarkerAdminCmd) {
        prefix = getConsoleLinePrefix(context ?? '?');
    } else if (type === ConsoleLineType.MarkerSystemCmd) {
        prefix = consoleSystemPrefix;
    } else if (type === ConsoleLineType.MarkerInfo) {
        prefix = consoleSystemPrefix;
    }
    return prefix;
}


/**
 * Handles fxserver stdio and turns it into a cohesive textual output
 */
export default class ConsoleStreamAssembler {
    private queue: (IncomingQueueBlockType | null)[] = [];
    private triggerQueue = throttle(250, this.processQueue.bind(this));
    private lastOutput: LastOutputInfoType = {
        type: ConsoleLineType.StdOut,
        src: '',
        eol: true,
    };
    private webBuffer = '';
    private stdoutBuffer = '';
    private fileBuffer = '';
    private markerLastTs = 0; //in seconds
    private markerIsPending = true;
    private markerOffset: number | undefined = undefined;

    constructor(private readonly flushCallback: FlushCallbackType) { }

    /**
     * Processes the queue to assemble the output
     */
    private processQueue() {
        const last = this.lastOutput; //For easier access

        //Checking if a new timestamp marker is needed
        const currTs = Date.now();
        const currMarkerTs = Math.floor(currTs / 1000);
        this.markerIsPending = currMarkerTs !== this.markerLastTs;
        this.markerOffset = undefined;

        //Processing the queue
        const delayedQueue: IncomingQueueBlockType[] = [];
        for (let i = 0; i < this.queue.length; i++) {
            const curr = this.queue[i];
            if (curr === null || !curr.data.length) continue;
            // const currEndsWithEol = curr.data[curr.data.length - 1] === '\n';

            //If the block is pending for too long, break prev line and output it
            if (curr.delayedSince && currTs - curr.delayedSince > MAX_HOLDOFF_MS) {
                this.bufferForcedEolMark();
                this.processNewLine(curr);
                continue;
            }

            //if the last line was finished
            if (last.eol) {
                this.processNewLine(curr);
                continue;
            }

            //if last line is unfinished, same source
            if (curr.src === last.src) {
                this.processPostfix(curr.data);
                continue;
                // if (!this.markerIsPending) {
                //     //no marker pending, consume the whole block
                //     this.bufferPostfix(curr.data, currEndsWithEol);
                //     continue;
                // }

                // //if a marker is pending we try to insert it in the first EOL
                // const currFirstEolIndex = curr.data.indexOf('\n');
                // if (currFirstEolIndex === -1) {
                //     //If doesn't have any EOL, consume the whole block
                //     this.bufferPostfix(curr.data, false);
                // } else {
                //     const isEolCrLf = currFirstEolIndex > 0 && curr.data[currFirstEolIndex - 1] === '\r';
                //     const foundEolLength = isEolCrLf ? 2 : 1;
                //     const currFirstEolAtEnd = currFirstEolIndex === curr.data.length - foundEolLength;
                //     if (currFirstEolAtEnd) {
                //         //curr ends with EOL: consume the whole block
                //         this.bufferPostfix(curr.data, true);
                //     } else {
                //         //curr has EOL in the middle: insert the marker at first line break
                //         const oldChunk = curr.data.substring(0, currFirstEolIndex + foundEolLength);
                //         this.bufferPostfix(oldChunk, true);
                //         curr.data = curr.data.substring(currFirstEolIndex + foundEolLength);
                //         this.bufferNewLine(curr, currEndsWithEol);
                //     }
                // }
                // continue;
            }

            //if last line is unfinished, different source
            //look forward to try to find the end of the line with same source in the same queue
            //but does not update the last ts, even if writing to it
            if (i + 1 < this.queue.length) {
                //if it's not the last block
                for (let j = i + 1; j < this.queue.length; j++) {
                    const upcoming = this.queue[j];
                    //upcoming block is the same as last but different than current
                    if (upcoming === null || upcoming.src !== last.src) continue;

                    const upcomingFirstEolIndex = upcoming.data.indexOf('\n');
                    if (upcomingFirstEolIndex === -1) {
                        //If doesn't have any EOL, consume the whole block
                        this.processPostfix(upcoming.data);
                        this.queue[j] = null;
                    } else {
                        const isEolCrLf = upcomingFirstEolIndex > 0 && curr.data[upcomingFirstEolIndex - 1] === '\r';
                        const foundEolLength = isEolCrLf ? 2 : 1;
                        const upcomingFirstEolAtEnd = upcomingFirstEolIndex === upcoming.data.length - foundEolLength;
                        if (upcomingFirstEolAtEnd) {
                            //upcoming ends with EOL: consume the whole block
                            this.processPostfix(upcoming.data);
                            this.queue[j] = null;
                        } else {
                            //upcoming has EOL in the middle: consume up to first line break
                            const chunk = upcoming.data.substring(0, upcomingFirstEolIndex + foundEolLength);
                            this.processPostfix(chunk);
                            upcoming.data = upcoming.data.substring(upcomingFirstEolIndex + foundEolLength);
                        }
                        break;
                    }
                }
            }

            //If by now the last line was completed, add it to the output
            //Else, add it to the pending queue
            if (last.eol) {
                this.processNewLine(curr);
            } else {
                curr.delayedSince ??= currTs;
                delayedQueue.push(curr);
            }
        }

        //Finishing up & flushing
        if (this.webBuffer.length || this.stdoutBuffer.length || this.fileBuffer.length) {
            console.dir({
                markerOffset: this.markerOffset,
                markerLastTs: this.markerLastTs,
                markerIsPending: this.markerIsPending,
            });
            let webFlushBuffer = '';
            if (this.markerOffset === undefined) {
                webFlushBuffer = this.webBuffer.replaceAll('§', SECT_ZWNBSP);
            } else {
                this.markerLastTs = currMarkerTs;
                if (this.markerOffset) {
                    webFlushBuffer = this.webBuffer.substring(0, this.markerOffset).replaceAll('§', SECT_ZWNBSP)
                        + `{§${currMarkerTs.toString(16)}}`
                        + this.webBuffer.substring(this.markerOffset).replaceAll('§', SECT_ZWNBSP)
                } else {
                    webFlushBuffer = `{§${currMarkerTs.toString(16)}}` + this.webBuffer.replaceAll('§', SECT_ZWNBSP);
                }
            }

            this.flushCallback(webFlushBuffer, this.stdoutBuffer, this.fileBuffer);
            this.webBuffer = '';
            this.stdoutBuffer = '';
            this.fileBuffer = '';
        }

        //Requeue delayed blocks or clear the queue
        this.queue = delayedQueue;
        if (this.queue.length) {
            this.triggerQueue();
        }
    }


    /**
     * Writes a postfix (continuation of unfinished line) to the buffer
     */
    private processPostfix(chunk: string) {
        //Shortcircuiting for empty strings
        if (!chunk.length) return;
        if (chunk === '\n' || chunk === '\r\n') {
            this.webBuffer += '\n';
            this.stdoutBuffer += '\n';
            this.fileBuffer += '\n';
            this.lastOutput.eol = true;
        } else {
            this.bufferChunk(chunk, true);
        }
    }


    /**
     * Writes a new line to the buffer
     * If a timestamp mark is pending and adds it to the buffer
     */
    private processNewLine(block: IncomingQueueBlockType) {
        this.lastOutput.type = block.type;
        this.lastOutput.src = block.src;
        this.lastOutput.context = block.context;
        this.bufferChunk(block.data, false);
    }


    /**
     * Writes a postfix (continuation of unfinished line) to the buffer
     */
    private bufferChunk(chunk: string, isPostfix: boolean) {
        console.dir({
            chunk,
            isPostfix,
        });
        const { type, context } = this.lastOutput;
        if (!isPostfix) {
            this.bufferMarker();
        }

        //Processing the chunk
        const chunkLines = chunk.split(/\r?\n/);
        this.lastOutput.eol = false;
        if (chunkLines.length && chunkLines[chunkLines.length - 1].length === 0) {
            chunkLines.pop();
            this.lastOutput.eol = true;
        }
        const lineTypePrefix = getStyledPrefix(type, context);
        let prefix = isPostfix ? '' : lineTypePrefix;
        for (let i = 0; i < chunkLines.length; i++) {
            if (i === 1) {
                prefix = lineTypePrefix;
                if (isPostfix) {
                    this.bufferMarker();
                }
            }
            const lineEol = i < chunkLines.length - 1 ? '\n' : '';
            this.webBuffer += WEB_COLORS[type](prefix + chunkLines[i]) + lineEol;
            this.stdoutBuffer += STDOUT_COLORS[type](prefix + chunkLines[i]) + lineEol;
            this.fileBuffer += prefix + chunkLines[i] + lineEol;
        }
        if (this.lastOutput.eol) {
            this.webBuffer += '\n';
            this.stdoutBuffer += '\n';
            this.fileBuffer += '\n';
            this.lastOutput.context = undefined;
        }
    }


    /**
     * Writes a new line to the buffer
     * If a timestamp mark is pending and adds it to the buffer
     */
    private bufferMarker() {
        console.error('bufferMarker', this.markerIsPending);
        if (this.markerIsPending) {
            this.markerOffset = this.webBuffer.length;
            this.markerIsPending = false;
        }
    }


    /**
     * Marks in the buffer that a line was forcefully broken with the unicode char "↩".
     * This happens when a line is incomplete and the newcomer times out.
     */
    private bufferForcedEolMark() {
        const FORCED_EOL = '\u21A9\n';
        this.webBuffer += FORCED_EOL;
        this.stdoutBuffer += FORCED_EOL;
        this.fileBuffer += FORCED_EOL;
    }


    /**
     * Queues a string to be processed by the output handler
     */
    public push(type: ConsoleLineType, data: string, context?: string) {
        this.queue.push({
            src: `${type}:${context}`, //just used for comparison against lastOutput
            type: type,
            data,
            context,
        });
        this.triggerQueue();
    }
};
