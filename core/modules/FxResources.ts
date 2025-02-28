const modulename = 'FxResources';
import consoleFactory from '@lib/console';
import { Stopwatch } from './FxMonitor/utils';
const console = consoleFactory(modulename);


type ResourceEventType = {
    type: 'txAdminResourceEvent';
    resource: string;
    event: 'onResourceStarting'
    | 'onResourceStart'
    | 'onServerResourceStart'
    | 'onResourceListRefresh'
    | 'onResourceStop'
    | 'onServerResourceStop';
};

type ResourceReportType = {
    ts: Date,
    resources: any[]
}

type ResPendingStartState = {
    name: string;
    time: Stopwatch;
}

type ResBootLogEntry = {
    tsBooted: number;
    resource: string;
    duration: number;
};


/**
 * Module responsible to track FXServer resource states.  
 * NOTE: currently it is not tracking the state during runtime, and it is just being used
 * to assist with tracking the boot process.
 */
export default class FxResources {
    public resourceReport?: ResourceReportType;
    private resBooting: ResPendingStartState | null = null;
    private resBootLog: ResBootLogEntry[] = [];


    /**
     * Reset boot state on server close
     */
    handleServerClose() {
        this.resBooting = null;
        this.resBootLog = [];
    }


    /**
     * Handler for all txAdminResourceEvent FD3 events
     */
    handleServerEvents(payload: ResourceEventType, mutex: string) {
        const { resource, event } = payload;
        if (!resource || !event) {
            console.verbose.error(`Invalid txAdminResourceEvent payload: ${JSON.stringify(payload)}`);
        } else if (event === 'onResourceStarting') {
            //Resource will start
            this.resBooting = {
                name: resource,
                time: new Stopwatch(true),
            }
        } else if (event === 'onResourceStart') {
            //Resource started
            this.resBootLog.push({
                resource,
                duration: this.resBooting?.time.elapsed ?? 0,
                tsBooted: Date.now(),
            })
        }
    }


    /**
     * Returns the status of the resource boot process
     */
    public get bootStatus() {
        let elapsedSinceLast = null;
        if (this.resBootLog.length > 0) {
            const tsMs = this.resBootLog[this.resBootLog.length - 1].tsBooted;
            elapsedSinceLast = Math.floor((Date.now() - tsMs) / 1000);
        }
        return {
            current: this.resBooting,
            elapsedSinceLast,
        }
    }


    /**
     * Handle resource report.
     * NOTE: replace this when we start tracking resource states internally
     */
    tmpUpdateResourceList(resources: any[]) {
        this.resourceReport = {
            ts: new Date(),
            resources,
        }
    }
};

/*
NOTE Resource load scenarios knowledge base:
- resource lua error:
    - `onResourceStarting` sourceRes
    - print lua error
    - `onResourceStart` sourceRes
- resource lua crash/hang:
    - `onResourceStarting` sourceRes
    - crash/hang
- dependency missing:
    - `onResourceStarting` sourceRes
    - does not get to `onResourceStart`
- dependency success:
    - `onResourceStarting` sourceRes
    - `onResourceStarting` dependency
    - `onResourceStart` dependency
    - `onResourceStart` sourceRes
- webpack/yarn fail:
    - `onResourceStarting` sourceRes
    - does not get to `onResourceStart`
- webpack/yarn success:
    - `onResourceStarting` chat
    - `onResourceStarting` yarn
    - `onResourceStart` yarn
    - `onResourceStarting` webpack
    - `onResourceStart` webpack
    - server first tick
    - wait for build
    - `onResourceStarting` chat
    - `onResourceStart` chat
- ensure started resource:
    - `onResourceStop` sourceRes
    - `onResourceStarting` sourceRes
    - `onResourceStart` sourceRes
    - `onServerResourceStop` sourceRes
    - `onServerResourceStart` sourceRes
*/
