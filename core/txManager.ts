import { getHostData } from "@lib/diagnostics";
import { isProxy } from "util/types";

export default class TxManager {
    public deployer: any = null; //FIXME: implementar o deployer

    //métodos de "high order component"
    //implementar lógica de status, lógicas multi-components, deployer, etc
    //implementar event bus
    //talvez o txRuntime?!

    constructor() {
        //FIXME: fxserver does not pipe those signals to nodejs, so we actually never get them
        // process.on('SIGINT', this.gracefulShutdown.bind(this));     //ctrl+c (mostly users)
        // process.on('SIGTERM', this.gracefulShutdown.bind(this));    //kill (docker, etc)
        // process.on('SIGHUP', this.gracefulShutdown.bind(this));     //terminal closed
        // RegisterCommand('quit', (...args: any) => {
        //     console.dir(args);
        //     console.log('quit command received');
        // }, false);

        //FIXME: mover o startReadyWatcher pra cá?

        //FIXME: mover o cron do HealthMonitor (getHostStats() + websocket push) para cá
        // setInterval(async () => {
        //     this.hostStats = await getHostStats();
        //     txCore.webServer.webSocket.pushRefresh('status');
        // }, 5000);

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
