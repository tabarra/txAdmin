// The objective of this file is to isolate the process management logic from the main process.
// Here no references to txCore, txConfig, or txManager should happen.
import { childProcessEventBlackHole, type ValidChildProcess } from "./utils";
import consoleFactory, { processStdioEnsureEol } from "@lib/console";


/**
 * Returns a string with the exit/close code & signal of a child process, properly formatted
 */
const getFxChildCodeSignalString = (code?: number | null, signal?: string | null) => {
    const details = [];
    if (typeof code === 'number') {
        details.push(`0x${code.toString(16).toUpperCase()}`);
    }
    if (typeof signal === 'string') {
        details.push(signal.toUpperCase());
    }
    if (!details.length) return '--';
    return details.join(', ');
}


/**
 * Manages the lifecycle of a child process, isolating process management logic from the main application.
 */
export default class ProcessManager {
    public readonly pid: number;
    public readonly mutex: string;
    public readonly netEndpoint: string;
    private readonly statusCallback: () => void;

    public readonly tsStart = Date.now();
    private tsKill: number | undefined;
    private tsExit: number | undefined;
    private tsClose: number | undefined;
    private fxs: ValidChildProcess | null;
    private exitCallback: (() => void) | undefined;

    //TODO: register input/output stats? good for debugging

    constructor(fxs: ValidChildProcess, props: ChildStateProps) {
        //Sanity check
        if (!fxs?.stdin?.writable) throw new Error(`Child process stdin is not writable.`);
        if (!props.mutex) throw new Error(`Invalid mutex.`);
        if (!props.netEndpoint) throw new Error(`Invalid netEndpoint.`);
        if (!props.onStatusUpdate) throw new Error(`Invalid status callback.`);

        //Instance properties
        this.pid = fxs.pid;
        this.fxs = fxs;
        this.mutex = props.mutex;
        this.netEndpoint = props.netEndpoint;
        this.statusCallback = props.onStatusUpdate;
        const console = consoleFactory(`FXProc][${this.pid}`);

        //The 'exit' event is emitted after the child process ends,
        // but the stdio streams might still be open.
        this.fxs.once('exit', (code, signal) => {
            this.tsExit = Date.now();
            const info = getFxChildCodeSignalString(code, signal);
            processStdioEnsureEol();
            console.warn(`FXServer Exited (${info}).`);
            this.exitCallback && this.exitCallback();
            this.triggerStatusUpdate();
            if (this.tsExit - this.tsStart <= 5000) {
                console.defer(500).warn('FXServer didn\'t start. This is not an issue with txAdmin.');
            }
        });

        //The 'close' event is emitted after a process has ended _and_ 
        // the stdio streams of the child process have been closed.
        // This event will never be emitted before 'exit'.
        this.fxs.once('close', (code, signal) => {
            this.tsClose = Date.now();
            const info = getFxChildCodeSignalString(code, signal);
            processStdioEnsureEol();
            console.warn(`FXServer Closed (${info}).`);
            this.destroy();
        });

        //The 'error' event is only relevant for `.kill()` method errors.
        this.fxs.on('error', (err) => {
            console.error(`FXServer Error Event:`);
            console.dir(err);
        });

        //Signaling the start of the server
        console.ok(`FXServer Started!`);
        this.triggerStatusUpdate();
    }


    /**
     * Safely triggers the status update callback
     */
    private triggerStatusUpdate() {
        try {
            this.statusCallback();
        } catch (error) {
            childProcessEventBlackHole('ProcessManager:statusCallback', error);
        }
    }


    /**
     * Ensures we did everything we can to send a kill signal to the child process
     * and that we are freeing up resources.
     */
    public destroy() {
        if (!this.fxs) return; //Already disposed
        try {
            this.tsKill = Date.now();
            this.fxs?.kill();
        } catch (error) {
            childProcessEventBlackHole('ProcessManager:destroy', error);
        } finally {
            this.fxs = null;
            this.triggerStatusUpdate();
        }
    }


    /**
     * Registers a callback to be called when the child process is destroyed
     */
    public onExit(callback: () => void) {
        this.exitCallback = callback;
    }

    /**
     * Get the proc info/stats for the history
     */
    public get stateInfo(): ChildProcessStateInfo {
        return {
            pid: this.pid,
            mutex: this.mutex,
            netEndpoint: this.netEndpoint,

            tsStart: this.tsStart,
            tsKill: this.tsKill,
            tsExit: this.tsExit,
            tsClose: this.tsClose,

            isAlive: this.isAlive,
            status: this.status,
            uptime: this.uptime,
        };
    }


    /**
     * If the child process is alive, meaning it has process running and the pipes open
     */
    public get isAlive() {
        return !!this.fxs && !this.tsExit && !this.tsClose;
    }


    /**
     * The overall state of the child process 
     */
    public get status(): ChildProcessState {
        if (!this.fxs) return ChildProcessState.Destroyed;
        if (this.tsExit) return ChildProcessState.Exited; //should be awaiting close
        return ChildProcessState.Alive;
    }


    /**
     * Uptime of the child process, until now or the last event 
     */
    public get uptime() {
        const now = Date.now();
        return Math.min(
            this.tsKill ?? now,
            this.tsExit ?? now,
            this.tsClose ?? now,
        ) - this.tsStart;
    }


    /**
     * The stdin stream of the child process, SHOULD be writable if this.isAlive
     */
    public get stdin() {
        return this.fxs?.stdin;
    }
}


export enum ChildProcessState {
    Alive = 'ALIVE',
    Exited = 'EXITED',
    Destroyed = 'DESTROYED',
}

type ChildStateProps = {
    mutex: string;
    netEndpoint: string;
    onStatusUpdate: () => void;
}


export type ChildProcessStateInfo = {
    //Input
    pid: number;
    mutex: string;
    netEndpoint: string;

    //Timings
    tsStart: number;
    tsKill?: number;
    tsExit?: number;
    tsClose?: number;

    //Status
    isAlive: boolean; //Same as ChildState.Alive for convenience
    status: ChildProcessState;
    uptime: number;
}
