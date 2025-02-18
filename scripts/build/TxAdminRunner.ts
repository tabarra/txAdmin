import child_process from 'node:child_process';
import { TxDevEnvType } from '../../shared/txDevEnv';

/**
 * Class to handle the fxserver process running txadmin
 */
export class TxAdminRunner {
    private fxChild: child_process.ChildProcess | null = null;
    private isRebootingPaused = false;
    private hasPendingReboot = false;
    private readonly spawnArgs: string[];

    constructor(
        private readonly fxsRootPath: string,
        private readonly fxsBinPath: string,
        private readonly txDevEnv: TxDevEnvType,
    ) { }

    spawnServer() {
        if (this.isRebootingPaused) {
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
        this.fxChild.on('close', (code) => {
            console.log('[RUNNER] FXServer Closed.');
        });
        this.fxChild.on('error', (err) => {
            console.log('[RUNNER] FXServer Errored:');
            console.dir(err);
        });
        this.fxChild.on('exit', () => {
            process.stdout.write('\n');
            console.log('[RUNNER] FXServer Exited.');
        });
    }

    killServer() {
        if (this.isRebootingPaused) return;
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

    toggleRebootPause() {
        if (this.isRebootingPaused) {
            console.log('[RUNNER] Unpausing reboot.');
            this.isRebootingPaused = false;
            if (this.hasPendingReboot) {
                this.hasPendingReboot = false;
                this.killServer();
                this.spawnServer();
            }
        } else {
            console.log('[RUNNER] Pausing reboot.');
            this.isRebootingPaused = true;
        }
    }
};
