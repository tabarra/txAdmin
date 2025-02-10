import { getHostData } from "@lib/diagnostics";
import { isProxy } from "util/types";
import { startReadyWatcher } from "./boot/startReadyWatcher";
import { Deployer } from "./deployer";
import { TxConfigState } from "@shared/enums";
import { GlobalStatusType } from "@shared/socketioTypes";


/**
 * This class is for "high order" logic and methods that shouldn't live inside any specific component.
 */
export default class TxManager {
    public deployer: Deployer | null = null; //FIXME: implementar o deployer

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

        //FIXME: mover o cron do FxMonitor (getHostStats() + websocket push) para cá
        //FIXME: if ever changing this, need to make sure the other data
        //in the status event will be pushed, since right some of now it
        //relies on this event every 5 seconds
        setInterval(async () => {
            txCore.webServer.webSocket.pushRefresh('status');
        }, 5000);

        //Pre-calculate static data
        setTimeout(() => {
            getHostData().catch((e) => { });
        }, 10_000);
    }

    // isDeployerRunning(): this is { deployer: Deployer } {
    //     return this.deployer !== null;
    // }

    // public gracefulShutdown(signal: NodeJS.Signals) {
    //     console.debug(`[TXM] Received ${signal}, shutting down gracefully...`);
    //     //TODO: implementar lógica de shutdown
    // }

    /**
     * Starts the deployer (TODO: rewrite deployer)
     */
    startDeployer(
        recipeText: string | false,
        deploymentID: string,
        targetPath: string,
        isTrustedSource: boolean,
        customMetaData: Record<string, string> = {},
    ) {
        if (this.deployer) {
            throw new Error('Deployer is already running');
        }
        this.deployer = new Deployer(recipeText, deploymentID, targetPath, isTrustedSource, customMetaData);
    }

    /**
     * Unknown, Deployer, Setup, Ready
     */
    get configState() {
        if (isProxy(txCore)) {
            return TxConfigState.Unkown;
        } else if (this.deployer) {
            return TxConfigState.Deployer;
        } else if (!txCore.fxRunner.isConfigured) {
            return TxConfigState.Setup;
        } else {
            return TxConfigState.Ready;
        }
    }

    /**
     * Returns the global status object that is sent to the clients
     */
    get globalStatus(): GlobalStatusType {
        return {
            configState: txManager.configState,
            discord: txCore.discordBot.status,
            runner: {
                isIdle: txCore.fxRunner.isIdle,
                isChildAlive: txCore.fxRunner.child?.isAlive ?? false,
            },
            server: {
                status: txCore.fxMonitor.currentStatus,
                name: txConfig.general.serverName,
                whitelist: txConfig.whitelist.mode,
            },
            // @ts-ignore scheduler type narrowing is wrong because cant use "as const" in javascript
            scheduler: txCore.fxScheduler.getStatus(), //no push events, updated every Scheduler.checkSchedule()
        }
    }
}

export type TxManagerType = InstanceType<typeof TxManager>;
