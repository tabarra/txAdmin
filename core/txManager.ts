import { getHostData } from "@lib/diagnostics";
import { isProxy } from "util/types";
import { startReadyWatcher } from "./boot/startReadyWatcher";
import { Deployer } from "./deployer";
import { TxConfigState } from "@shared/enums";
import type { GlobalStatusType } from "@shared/socketioTypes";
import quitProcess from "@lib/quitProcess";
import consoleFactory, { processStdioEnsureEol } from "@lib/console";
const console = consoleFactory('Manager');


/**
 * This class is for "high order" logic and methods that shouldn't live inside any specific component.
 */
export default class TxManager {
    public deployer: Deployer | null = null; //FIXME: implementar o deployer
    private readonly moduleShutdownHandlers: (() => void)[] = [];
    private isShuttingDown = false;

    //TODO: move txRuntime here?!

    constructor() {
        //Listen for shutdown signals
        process.on('SIGHUP', this.gracefulShutdown.bind(this));     //terminal closed
        process.on('SIGINT', this.gracefulShutdown.bind(this));     //ctrl+c (mostly users)
        process.on('SIGTERM', this.gracefulShutdown.bind(this));    //kill (docker, etc)

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


    /**
     * Gracefully shuts down the application by running all exit handlers.  
     * If the process takes more than 5 seconds to exit, it will force exit.
     */
    public async gracefulShutdown(signal: NodeJS.Signals) {
        //Prevent race conditions
        if (this.isShuttingDown) {
            processStdioEnsureEol();
            console.warn(`Got ${signal} while already shutting down.`);
            return;
        }
        console.warn(`Got ${signal}, shutting down...`);
        this.isShuttingDown = true;

        //Sets a hard limit to the shutdown process
        setTimeout(() => {
            console.error(`Graceful shutdown timed out after 5s, forcing exit...`);
            quitProcess(1);
        }, 5000);

        //Run all exit handlers
        await Promise.allSettled(this.moduleShutdownHandlers.map((handler) => handler()));
        console.debug(`All exit handlers finished, shutting down...`);
        quitProcess(0);
    }


    /**
     * Adds a handler to be run when txAdmin gets a SIG* event
     */
    public addShutdownHandler(handler: () => void) {
        this.moduleShutdownHandlers.push(handler);
    }


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


    // isDeployerRunning(): this is { deployer: Deployer } {
    //     return this.deployer !== null;
    // }


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
