const modulename = 'ResourcesManager';
import consoleFactory from '@extras/console';
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

export default class ResourcesManager {
    activeStartingTime: Date | null = null;
    activeStartingResource: string | null = null;
    lastResourceStartTime: Date | null = null;
    resourceReport?: ResourceReportType;

    constructor() {}


    /**
     * Handler for all txAdminResourceEvent structured trace events
     */
    handleServerEvents(payload: ResourceEventType, mutex: string) {
        // console.log(`${payload.event}: ${payload.resource}`);
        if (payload.event === 'onResourceStarting') {
            this.activeStartingResource = payload.resource;
            this.activeStartingTime = new Date();
        } else if (payload.event === 'onResourceStart') {
            this.activeStartingResource = null;
            this.activeStartingTime = null;
            this.lastResourceStartTime = new Date();
        }
    }


    /**
     * Handler for server restart
     */
    handleServerStop() {
        this.activeStartingResource = null;
        this.activeStartingTime = null;
    }


    /**
     * Handler for server restart.
     * NOTE: replace this when we start tracking resource states internally
     */
    tmpGetPendingStart() {
        const getSecondsDiff = (date: Date | null) => {
            return date !== null ? Math.round((Date.now() - date.getTime()) / 1000) : null;
        }
        return {
            startingResName: this.activeStartingResource,
            startingElapsedSecs: getSecondsDiff(this.activeStartingTime),
            lastStartElapsedSecs: getSecondsDiff(this.lastResourceStartTime),
        };
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
