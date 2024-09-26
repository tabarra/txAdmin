const modulename = 'ConsoleStreamAssembler';
import { debounce } from 'throttle-debounce';
import consoleFactory from '@extras/console';
import { EOL } from 'node:os'
import { FxsConsoleMessageType } from './index';
const console = consoleFactory(modulename);


//Max time to wait before breaking a line to output from different sources
const MAX_HOLDOFF_MS = 2500;
//Unicode char "↩" to indicate the forced break of a line
const FORCED_EOL = '\u21A9' + EOL;


//Types
type FlushCallbackType = (parts: FlushQueueBlockType[]) => void;
export type FlushQueueBlockType = {
    ts?: number;
    noPrefix?: boolean;
    src: FxsConsoleMessageType;
    data: string;
    context?: string;
};

type LastOutputInfoType = {
    ts: number; //always in seconds, floored
    src: FxsConsoleMessageType;
    eol: boolean;
}

type IncomingQueueBlockType = {
    src: FxsConsoleMessageType;
    data: string;
    context?: string;
    delayedSince?: number;
}


/**
 * Handles fxserver stdio and turns it into a cohesive textual output
 */
export default class ConsoleStreamAssembler {
    private queue: (IncomingQueueBlockType | null)[] = [];
    private triggerQueue = debounce(250, this.processQueue.bind(this));
    private lastOutput: LastOutputInfoType = {
        ts: 0,
        src: FxsConsoleMessageType.StdOut,
        eol: true,
    };

    constructor(private readonly flushCallback: FlushCallbackType) { }

    /**
     * Processes the queue to assemble the output
     */
    private processQueue() {
        // console.log(
        //     'Processing queue:',
        //     this.queue.length,
        //     this.queue.map((x) => x && [x.src, x.data]),
        // );
        const last = this.lastOutput; //For easier access
        const currTs = Date.now();
        const currMarkerTs = Math.floor(currTs / 1000);
        let isMarkerPending = currMarkerTs !== last.ts;
        const outQueue: FlushQueueBlockType[] = [];
        const delayedQueue: IncomingQueueBlockType[] = [];
        for (let i = 0; i < this.queue.length; i++) {
            const curr = this.queue[i];
            if (curr === null || !curr.data.length) continue;
            // const currEndsWithEol = curr.data.endsWith(EOL);
            const currEndsWithEol = curr.data[curr.data.length - 1] === '\n';

            // console.warn('='.repeat(80));
            // console.error({
            //     lastSrc: last.src,
            //     lastEol: last.eol,
            //     isMarkerPending,
            //     src: curr.src,
            //     data: curr.data,
            //     currEndsWithEol,
            //     delay: curr.delayedSince ? currTs - curr.delayedSince : null,
            // });


            //If the block is pending for too long, break prev line and output it
            if (curr.delayedSince && currTs - curr.delayedSince > MAX_HOLDOFF_MS) {
                outQueue.push({
                    noPrefix: true,
                    src: last.src,
                    data: FORCED_EOL,
                });
                const ts = isMarkerPending ? currMarkerTs : undefined;
                outQueue.push({
                    ts,
                    src: curr.src,
                    data: curr.data,
                    context: curr.context,
                });
                last.ts = currMarkerTs;
                last.src = curr.src;
                last.eol = currEndsWithEol;
                isMarkerPending = false;
                // console.error(2, 'the block is pending for too long, break prev line and output it');
                continue;
            }

            //if the last line was finished
            if (last.eol) {
                const ts = isMarkerPending ? currMarkerTs : undefined;
                outQueue.push({
                    ts,
                    src: curr.src,
                    data: curr.data,
                    context: curr.context,
                });
                last.ts = currMarkerTs;
                last.src = curr.src;
                last.eol = currEndsWithEol;
                isMarkerPending = false;
                // console.error(1, 'the last line was finished');
                continue;
            }

            //if last line is unfinished, same source
            if (curr.src === last.src) {
                if (!isMarkerPending) {
                    outQueue.push({
                        noPrefix: true,
                        src: curr.src,
                        data: curr.data,
                        context: curr.context,
                    });
                    last.eol = currEndsWithEol;
                    // console.error(1, 'the last line is unfinished, same source - no marker pending');
                } else {
                    //if a marker is pending we try to insert it in the first EOL
                    const currEolIndex = curr.data.indexOf('\n');
                    if (currEolIndex === -1) {
                        //If doesn't have any EOL, consume the whole block
                        outQueue.push({
                            noPrefix: true,
                            src: curr.src,
                            data: curr.data,
                            context: curr.context,
                        });
                        // console.error(1, 'the last line is unfinished, same source - no EOL');
                    } else {
                        const isEolCrLf = currEolIndex > 0 && curr.data[currEolIndex - 1] === '\r';
                        const foundEolLength = isEolCrLf ? 2 : 1;
                        const currEolAtEnd = currEolIndex === curr.data.length - foundEolLength;
                        if (currEolAtEnd) {
                            //curr ends with EOL: consume the whole block
                            outQueue.push({
                                noPrefix: true,
                                src: curr.src,
                                data: curr.data,
                            });
                            last.eol = true;
                            // console.error(1, 'the last line is unfinished, same source - EOL at end');
                        } else {
                            //curr has EOL in the middle: insert the marker at first line break
                            const oldChunk = curr.data.substring(0, currEolIndex + foundEolLength);
                            outQueue.push({
                                noPrefix: true,
                                src: curr.src,
                                data: oldChunk,
                            });
                            const newChunk = curr.data.substring(currEolIndex + foundEolLength);
                            outQueue.push({
                                ts: currMarkerTs,
                                src: curr.src,
                                data: newChunk,
                                context: curr.context,
                            });
                            last.ts = currMarkerTs;
                            last.eol = currEndsWithEol;
                            isMarkerPending = false;
                            // console.error(2, 'the last line is unfinished, same source - EOL at middle');
                        }
                    }
                }
                continue;
            }

            //if last line is unfinished, different source
            //look forward to try to find the end of the line with same source in the same queue
            //but does not update the last ts, even if writing to it
            if (i + 1 < this.queue.length) {
                for (let j = i + 1; j < this.queue.length; j++) {
                    const upcoming = this.queue[j];
                    //upcoming block is the same as last but different than current
                    if (upcoming === null || upcoming.src !== last.src) continue;

                    const upcomingEolIndex = upcoming.data.indexOf('\n');
                    if (upcomingEolIndex === -1) {
                        //If doesn't have any EOL, consume the whole block
                        outQueue.push({
                            noPrefix: true,
                            src: upcoming.src,
                            data: upcoming.data,
                            context: curr.context, //FIXME: idk
                        });
                        this.queue[j] = null;
                        // console.error(1, 'upcoming no EOL');
                    } else {
                        const isEolCrLf = upcomingEolIndex > 0 && curr.data[upcomingEolIndex - 1] === '\r';
                        const foundEolLength = isEolCrLf ? 2 : 1;
                        const upcomingEolAtEnd = upcomingEolIndex === upcoming.data.length - foundEolLength;
                        if (upcomingEolAtEnd) {
                            //upcoming ends with EOL: consume the whole block
                            outQueue.push({
                                noPrefix: true,
                                src: upcoming.src,
                                data: upcoming.data,
                                context: curr.context, //FIXME: idk
                            });
                            this.queue[j] = null;
                            // console.error(1, 'upcoming EOL at end');
                        } else {
                            //upcoming has EOL in the middle: consume up to first line break
                            const chunk = upcoming.data.substring(0, upcomingEolIndex + foundEolLength);
                            outQueue.push({
                                noPrefix: true,
                                src: upcoming.src,
                                data: chunk,
                                context: curr.context, //FIXME: idk
                            });
                            upcoming.data = upcoming.data.substring(upcomingEolIndex + foundEolLength);
                            // console.error(2, 'upcoming EOL at middle');
                        }
                        last.eol = true;
                        break;
                    }
                }
            }

            //If by now the last line was completed, add it to the output
            //Else, add it to the pending queue
            if (last.eol) {
                const ts = isMarkerPending ? currMarkerTs : undefined;
                isMarkerPending = false;
                outQueue.push({ 
                    ts, 
                    src: curr.src, 
                    data: curr.data,
                    context: curr.context,
                });
                last.ts = currMarkerTs;
                last.src = curr.src;
                last.eol = currEndsWithEol;
                // console.error(1, 'the last line was completed, add it to the output');
            } else {
                curr.delayedSince ??= currTs;
                delayedQueue.push(curr);
                // console.error(false, 'adding it to the pending queue');
            }
        }

        //Finishing up & flushing
        if (outQueue.length) {
            console.log('flushing:', outQueue.length);
            this.flushCallback(outQueue);
        }

        //Requeue delayed blocks or clear the queue
        this.queue = delayedQueue;
        if (this.queue.length) {
            this.triggerQueue();
        }
    }


    /**
     * Queues a string to be processed by the output handler
     */
    public push(source: FxsConsoleMessageType, data: string, context?: string) {
        this.queue.push({
            src: source,
            data,
            context,
        });
        this.triggerQueue();
    }
};
