import child_process from 'node:child_process';
import { TxDevEnvType } from '../../shared/txDevEnv';
import path from 'node:path/posix';

/**
 * Class to handle the fxserver process running txadmin
 */
export class TxAdminRunner {
    private fxChild: child_process.ChildProcess | null = null;
    private isRebootingPaused = false;
    private hasPendingReboot = false;

    constructor(
        private readonly fxsRootPath: string,
        private readonly fxsBinPath: string,
        private readonly txDevEnv: TxDevEnvType,
    ) { }

    getStatus() {
        return {
            running: this.fxChild !== null,
            pid: this.fxChild?.pid ?? null,
            autoRestartPaused: this.isRebootingPaused,
            restartPendingOnUnpause: this.hasPendingReboot,
        };
    }

    // Manual restarts bypass the automatic restart pause without changing it.
    restartServer() {
        this.killServer(true);
        this.hasPendingReboot = false;
        this.spawnServer(true);
    }

    spawnServer(bypassAutoRestartPause = false) {
        if (this.isRebootingPaused && !bypassAutoRestartPause) {
            console.log('[RUNNER] Boot request received, scheduling for unpause.');
            this.hasPendingReboot = true;
            return;
        }

        //If the server is already alive
        if (this.fxChild !== null) {
            return console.error('[RUNNER] The server is already started.');
        }
        console.log('[RUNNER] spawning process.');

        //Starting server
        try {
            this.fxChild = child_process.spawn(
                // //If running standalone
                // // 'C:\\Program Files\\nodejs\\node.exe',
                // // 'node',
                // 'bun',
                // [
                //     path.join(this.fxsRootPath, 'citizen', 'system_resources', 'monitor', 'core', 'index.js'),
                //     // path.join(this.fxsRootPath, 'system_resources', 'txadmin', 'core', 'index.js'),
                //     '--fxspath',
                //     this.fxsRootPath,
                //     ...(this.txDevEnv.LAUNCH_ARGS ?? [])
                // ],

                //If running fxserver
                this.fxsBinPath,
                this.txDevEnv.LAUNCH_ARGS ?? [],

                {
                    // stdio: "inherit",
                    cwd: this.fxsRootPath,
                    env: {
                        ...process.env,
                        TERM: 'xterm-256color',
                        FORCE_COLOR: '3',
                        TXDEV_SRC_PATH: process.cwd(),
                        TXDEV_ENABLED: 'true',
                    },
                },
            );
            this.hasPendingReboot = false;
        } catch (error) {
            console.error('[RUNNER] Failed to start FXServer with the following error:');
            console.dir(error);
            process.exit(1);
        }

        //Setting up stream handlers
        this.fxChild.stdout!.setEncoding('utf8');
        this.fxChild.stdout!.pipe(process.stdout);
        this.fxChild.stderr!.pipe(process.stderr);

        //Setting up event handlers
        const spawnedChild = this.fxChild;
        this.fxChild.on('close', (code) => {
            if (this.fxChild === spawnedChild) this.fxChild = null;
            console.log('[RUNNER] FXServer Closed.');
        });
        this.fxChild.on('error', (err) => {
            console.log('[RUNNER] FXServer Errored:');
            console.dir(err);
        });
        spawnedChild.on('exit', () => {
            if (this.fxChild === spawnedChild) this.fxChild = null;
            process.stdout.write('\n');
            console.log('[RUNNER] FXServer Exited.');
        });
    }

    killServer(bypassAutoRestartPause = false) {
        if (this.isRebootingPaused && !bypassAutoRestartPause) return;
        try {
            if (this.fxChild !== null) {
                console.log('[RUNNER] killing process.');
                this.fxChild.kill();
                this.fxChild = null;
            }
        } catch (error) {
            console.error((error as any).message);
        }
    }

    removeRebootPause() {
        console.log('[RUNNER] Removing reboot pause.');
        this.isRebootingPaused = false;
    }

    setAutoRestartPaused(autoRestartPaused: boolean) {
        if (this.isRebootingPaused === autoRestartPaused) return;
        this.isRebootingPaused = autoRestartPaused;
        if (!autoRestartPaused) {
            console.log('[RUNNER] Unpausing reboot.');
            if (this.hasPendingReboot) {
                this.hasPendingReboot = false;
                this.killServer();
                this.spawnServer();
            }
        } else {
            console.log('[RUNNER] Pausing reboot.');
        }
    }
};
