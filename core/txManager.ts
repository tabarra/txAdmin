import { getHostData } from "@lib/diagnostics";
import { isProxy } from "util/types";
import { startReadyWatcher } from "./boot/startReadyWatcher";


/**
 * This class is for "high order" logic and methods that shouldn't live inside any specific component.
 */
export default class TxManager {
    public deployer: any = null; //FIXME: implementar o deployer

    //TODO: add event bus?!
    //TODO: move txRuntime here?!

    constructor() {
        //FIXME: fxserver does not pipe those signals to nodejs, so we actually never get them
        // process.on('SIGINT', this.gracefulShutdown.bind(this));     //ctrl+c (mostly users)
        // process.on('SIGTERM', this.gracefulShutdown.bind(this));    //kill (docker, etc)
        // process.on('SIGHUP', this.gracefulShutdown.bind(this));     //terminal closed
        // RegisterCommand('quit', (...args: any) => {
        //     console.dir(args);
        //     console.log('quit command received');
        // }, false);

        //Sync start, boot fxserver when conditions are met
        startReadyWatcher(() => {
            txCore.fxRunner.signalStartReady();
        });

        //FIXME: mover o cron do HealthMonitor (getHostStats() + websocket push) para cá
        //FIXME: if ever changing this, need to make sure the other data
        //in the status event will be pushed, since right some of now it
        //relies on this event every 5 seconds
        setInterval(async () => {
            txCore.webServer.webSocket.pushRefresh('status');
        }, 5000);

        //FIXME:
        //Pre-calculate static data
        setTimeout(() => {
            getHostData().catch((e) => { });
        }, 10_000);
    }

    // public gracefulShutdown(signal: NodeJS.Signals) {
    //     console.debug(`[TXM] Received ${signal}, shutting down gracefully...`);
    //     //TODO: implementar lógica de shutdown
    // }

    // get status() {
    //     if (isProxy(txCore)) {
    //         return 'idk';
    //     }

    //     //tem que lidar com isProxy(txCore)
    //     return 'idk';
    // }
}

export type TxManagerType = InstanceType<typeof TxManager>;
