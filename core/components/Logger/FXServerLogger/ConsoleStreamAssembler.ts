const modulename = 'ConsoleStreamAssembler';
import { debounce } from 'throttle-debounce';
import TxAdmin from '@core/txAdmin';
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
export type FlushQueueStringType = {
    src: FxsConsoleMessageType;
    data: string;
};
export type FlushQueueTimestampType = {
    ts: number;
};
export type FlushQueueBlockType = FlushQueueStringType | FlushQueueTimestampType;

type LastOutputInfoType = {
    ts: number; //always in seconds, floored
    src: FxsConsoleMessageType;
    eol: boolean;
}

type IncomingQueueBlockType = {
    src: FxsConsoleMessageType;
    data: string;
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
        const last = this.lastOutput; //For easier access
        const currTs = Date.now();
        const currMarkerTs = Math.floor(currTs / 1000);
        let isMarkerPending = currMarkerTs !== last.ts;
        let markerOffset: number | undefined;
        let buffer = '';
        const outQueue: FlushQueueBlockType[] = [];
        const delayedQueue: IncomingQueueBlockType[] = [];
        for (let i = 0; i < this.queue.length; i++) {
            const curr = this.queue[i];
            if (curr === null || !curr.data.length) continue;
            const currEndsWithEol = curr.data.endsWith(EOL);

            //If the block is pending for too long, break prev line and output it
            if (curr.delayedSince && currTs - curr.delayedSince > MAX_HOLDOFF_MS) {
                buffer += FORCED_EOL;
                if (isMarkerPending) {
                    markerOffset = buffer.length;
                    isMarkerPending = false;
                }
                buffer += curr.data;
                last.ts = currMarkerTs;
                last.src = curr.src;
                last.eol = currEndsWithEol;
                // this.queue[i] = null; //probably not needed
                continue;
            }

            //same source or finished line
            if (curr.src === last.src || last.eol) {
                if (last.eol && isMarkerPending) {
                    markerOffset = buffer.length;
                    isMarkerPending = false;
                }
                buffer += curr.data;
                last.ts = currMarkerTs;
                last.src = curr.src;
                last.eol = currEndsWithEol;
                // this.queue[i] = null; //probably not needed
                continue;
            }

            //last line from different source and incomplete
            //look forward to try to find the end of the line with same source in the same queue
            //but does not update the last ts, even if writing to it
            if (i + 1 < this.queue.length) {
                for (let j = i + 1; j < this.queue.length; j++) {
                    const upcoming = this.queue[j];
                    //upcoming block is the same as last but different than current
                    if (upcoming === null || upcoming.src !== last.src) continue;

                    const upcomingEolIndex = upcoming.data.indexOf(EOL);
                    if (upcomingEolIndex === -1) {
                        //If doesn't have any EOL, consume the whole block
                        buffer += upcoming.data;
                        this.queue[j] = null;
                    } else {
                        //If ends with EOL, consume the whole block, or shorten it
                        const upcomingEndsWithEol = upcomingEolIndex === upcoming.data.length - EOL.length;
                        if (upcomingEndsWithEol) {
                            buffer += upcoming.data;
                            this.queue[j] = null;
                        } else {
                            buffer += upcoming.data.substring(0, upcomingEolIndex + EOL.length);
                            upcoming.data = upcoming.data.substring(upcomingEolIndex + EOL.length);
                        }
                        last.eol = true;
                        break;
                    }
                }
            }

            //If by now the last line was completed, add it to the output
            //Else, add it to the pending queue
            if (last.eol) {
                if (isMarkerPending) {
                    markerOffset = buffer.length;
                    isMarkerPending = false;
                }
                buffer += curr.data;
                last.ts = currMarkerTs;
                last.src = curr.src;
                last.eol = currEndsWithEol;
                // this.queue[i] = null; //probably not needed
            } else {
                curr.delayedSince = currTs;
                delayedQueue.push(curr);
            }
        }

        //Finishing up & flushing
        if (buffer.length) {
            let out;
            if (markerOffset !== undefined) {
                out = buffer.substring(0, markerOffset).replaceAll('§', SECT_ZWNBSP)
                    + `{§${currMarkerTs.toString(16)}}`
                    + buffer.substring(markerOffset).replaceAll('§', SECT_ZWNBSP);
            } else {
                out = buffer.replaceAll('§', SECT_ZWNBSP);
            }
            this.flushCallback(out);
        }

        //Requeue pending blocks or clear the queue
        this.queue = delayedQueue;
        if (this.queue.length) {
            this.queue = delayedQueue;
            this.triggerQueue();
        }
    }


    /**
     * Queues a string to be processed by the output handler
     */
    public push(source: FxsConsoleMessageType, data: string) {
        this.queue.push({ src: source, data });
        this.triggerQueue();
    }
};
