const modulename = 'FXRunner';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgsStringToArgv } from 'string-argv';
import StreamValues from 'stream-json/streamers/StreamValues';

import { convars, txEnv } from '@core/globalData';
import { validateFixServerConfig } from '@lib/fxserver/fxsConfigHelper';
import { now } from '@lib/misc';
import Fd3Handler from './fd3Handler';

import { customAlphabet } from 'nanoid/non-secure';
import dict49 from 'nanoid-dictionary/nolookalikes';
import consoleFactory from '@lib/console';
import { ConsoleLineType } from '@modules/Logger/FXServerLogger';
const console = consoleFactory(modulename);
const genMutex = customAlphabet(dict49, 5);


//Helpers
const getMutableConvars = (isCmdLine = false) => {
    const checkPlayerJoin = (
        txConfig.playerDatabase.onJoinCheckBan
        || txConfig.playerDatabase.whitelistMode !== 'disabled'
    );

    //type, name, value
    const convars = [
        ['set', 'txAdmin-serverName', txConfig.global.serverName ?? 'txAdmin'],
        ['setr', 'txAdmin-locale', txConfig.global.language ?? 'en'],
        ['set', 'txAdmin-localeFile', txCore.translator.customLocalePath ?? false],
        ['setr', 'txAdmin-verbose', console.isVerbose],
        ['set', 'txAdmin-checkPlayerJoin', checkPlayerJoin],
        ['set', 'txAdmin-menuAlignRight', txConfig.global.menuAlignRight],
        ['set', 'txAdmin-menuPageKey', txConfig.global.menuPageKey],
        ['set', 'txAdmin-hideAdminInPunishments', txConfig.global.hideAdminInPunishments],
        ['set', 'txAdmin-hideAdminInMessages', txConfig.global.hideAdminInMessages],
        ['set', 'txAdmin-hideDefaultAnnouncement', txConfig.global.hideDefaultAnnouncement],
        ['set', 'txAdmin-hideDefaultDirectMessage', txConfig.global.hideDefaultDirectMessage],
        ['set', 'txAdmin-hideDefaultWarning', txConfig.global.hideDefaultWarning],
        ['set', 'txAdmin-hideDefaultScheduledRestartWarning', txConfig.global.hideDefaultScheduledRestartWarning],
    ]; //satisfies [set: string, name: string, value: any][]

    const prefix = isCmdLine ? '+' : '';
    return convars.map((c) => ([
        prefix + c[0],
        c[1],
        c[2].toString(),
    ]));
};

//Blackhole event logger
let lastBlackHoleSpewTime = 0;
const blackHoleSpillMaxInterval = 5000;
const chanEventBlackHole = (...args) => {
    const currentTime = Date.now();
    if (currentTime - lastBlackHoleSpewTime > blackHoleSpillMaxInterval) {
        //Let's call this "hawking radiation"
        console.verbose.error('StdIo unexpected event:');
        console.verbose.dir(args);
        lastLogTime = currentTime;
    }
};

export default class FxRunner {
    constructor() {
        //Checking config validity
        if (txConfig.fxRunner.shutdownNoticeDelay < 0 || txConfig.fxRunner.shutdownNoticeDelay > 30) {
            throw new Error('The fxRunner.shutdownNoticeDelay setting must be between 0 and 30 seconds.');
        }

        this.spawnVariables = null;
        this.fxChild = null;
        this.restartDelayOverride = 0;
        this.history = [];
        this.lastKillRequest = 0;
        this.fxServerHost = null;
        this.currentMutex = null;
        this.cfxId = null;
        this.fd3Handler = new Fd3Handler();
    }


    /**
     * Refresh fxRunner configurations
     */
    refreshConfig() {
        // ???
    }


    /**
     * Receives the signal that all the start banner was already printed and other modules loaded
     */
    signalStartReady() {
        if (!txConfig.fxRunner.autostart) return;

        if (!this.isConfigured) {
            return console.warn('Please open txAdmin on the browser to configure your server.');
        }

        if (!txCore.adminVault.hasAdmins()) {
            return console.warn('The server will not auto start because there are no admins configured.');
        }

        this.spawnServer(true);
    }


    /**
     * Setup the spawn parameters
     */
    setupVariables() {
        // Prepare extra args
        let extraArgs = [];
        if (typeof txConfig.fxRunner.commandLine === 'string' && txConfig.fxRunner.commandLine.length) {
            extraArgs = parseArgsStringToArgv(txConfig.fxRunner.commandLine);
        }

        // Prepare default args (these convars can't change without restart)
        const txAdminInterface = (convars.forceInterface)
            ? `${convars.forceInterface}:${convars.txAdminPort}`
            : `127.0.0.1:${convars.txAdminPort}`;
        const cmdArgs = [
            getMutableConvars(true),
            extraArgs,
            '+set', 'onesync', txConfig.fxRunner.onesync,
            '+sets', 'txAdmin-version', txEnv.txaVersion,
            '+setr', 'txAdmin-menuEnabled', txConfig.global.menuEnabled,
            '+set', 'txAdmin-luaComHost', txAdminInterface,
            '+set', 'txAdmin-luaComToken', txCore.webServer.luaComToken,
            '+set', 'txAdminServerMode', 'true', //Can't change this one due to fxserver code compatibility
            '+exec', txConfig.fxRunner.cfgPath,
        ].flat(2);

        // Configure spawn parameters according to the environment
        if (txEnv.isWindows) {
            this.spawnVariables = {
                command: `${txEnv.fxServerPath}/FXServer.exe`,
                args: cmdArgs,
            };
        } else {
            const alpinePath = path.resolve(txEnv.fxServerPath, '../../');
            this.spawnVariables = {
                command: `${alpinePath}/opt/cfx-server/ld-musl-x86_64.so.1`,
                args: [
                    '--library-path', `${alpinePath}/usr/lib/v8/:${alpinePath}/lib/:${alpinePath}/usr/lib/`,
                    '--',
                    `${alpinePath}/opt/cfx-server/FXServer`,
                    '+set', 'citizen_dir', `${alpinePath}/opt/cfx-server/citizen/`,
                    ...cmdArgs,
                ],
            };
        }
    }


    /**
     * Spawns the FXServer and sets up all the event handlers
     * @param {boolean} announce
     */
    async spawnServer(announce) {
        //If the server is already alive
        if (this.fxChild !== null) {
            const msg = `The server is already started.`;
            console.error(msg);
            return msg;
        }

        //Setup variables
        txCore.webServer.resetToken();
        this.currentMutex = genMutex();
        this.setupVariables();
        console.verbose.log('Spawn Variables: ' + this.spawnVariables.args.join(' '));
        //Sanity Check
        if (
            this.spawnVariables == null
            || typeof this.spawnVariables.command == 'undefined'
            || typeof this.spawnVariables.args == 'undefined'
        ) {
            const msg = `this.spawnVariables is not set.`;
            console.error(msg);
            return msg;
        }
        //If there is any FXServer configuration missing
        if (!this.isConfigured) {
            const msg = `Cannot start the server with missing configuration (serverDataPath || cfgPath).`;
            console.error(msg);
            return msg;
        }

        //Validating server.cfg & configuration
        try {
            const result = await validateFixServerConfig(txConfig.fxRunner.cfgPath, txConfig.fxRunner.serverDataPath);
            if (result.errors) {
                const msg = `**Unable to start the server due to error(s) in your config file(s):**\n${result.errors}`;
                console.error(msg);
                return msg;
            }
            if (result.warnings) {
                const msg = `**Warning regarding your configuration file(s):**\n${result.warnings}`;
                console.warn(msg);
            }

            this.fxServerHost = result.connectEndpoint;
        } catch (error) {
            const errMsg = `server.cfg error: ${error.message}`;
            console.error(errMsg);
            if (error.message.includes('unreadable')) {
                console.error('That is the file where you configure your server and start resources.');
                console.error('You likely moved/deleted your server files or copied the txData folder from another server.');
                console.error('To fix this issue, open the txAdmin web interface then go to "Settings > FXServer" and fix the "Server Data Folder" and "CFG File Path".');
            }
            return errMsg;
        }

        //Reseting monitor stats
        txCore.healthMonitor.resetMonitorStats();

        //Resetting frontend playerlist
        txCore.webServer.webSocket.buffer('playerlist', {
            mutex: this.currentMutex,
            type: 'fullPlayerlist',
            playerlist: [],
        });

        //Announcing
        if (announce === 'true' || announce === true) {
            txCore.discordBot.sendAnnouncement({
                type: 'success',
                description: {
                    key: 'server_actions.spawning_discord',
                    data: { servername: txConfig.global.serverName },
                },
            });
        }

        //Starting server
        this.fxChild = spawn(
            this.spawnVariables.command,
            this.spawnVariables.args,
            {
                cwd: txConfig.fxRunner.serverDataPath,
                stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
            },
        );
        if (typeof this.fxChild.pid === 'undefined') {
            throw new Error(`Executon of "${this.spawnVariables.command}" failed.`);
        }
        const pid = this.fxChild.pid.toString();
        console.ok(`>> [${pid}] FXServer Started!`);
        txCore.logger.fxserver.logFxserverBoot(pid);
        this.history.push({
            pid,
            timestamps: {
                start: now(),
                kill: false,
                exit: false,
                close: false,
            },
        });
        const historyIndex = this.history.length - 1;
        txCore.webServer.webSocket.pushRefresh('status');

        //Setting up stream handlers
        this.fxChild.stdout.setEncoding('utf8');

        //Setting up event handlers
        this.fxChild.on('close', function (code) {
            let printableCode;
            if (typeof code === 'number') {
                printableCode = `0x${code.toString(16).toUpperCase()}`;
            } else {
                printableCode = new String(code).toUpperCase();
            }
            console.warn(`>> [${pid}] FXServer Closed (${printableCode}).`);
            this.history[historyIndex].timestamps.close = now();
            txCore.webServer.webSocket.pushRefresh('status');
        }.bind(this));
        this.fxChild.on('disconnect', function () {
            console.warn(`>> [${pid}] FXServer Disconnected.`);
        }.bind(this));
        this.fxChild.on('error', function (err) {
            console.warn(`>> [${pid}] FXServer Errored:`);
            console.dir(err);
        }.bind(this));
        this.fxChild.on('exit', function () {
            process.stdout.write('\n'); //Make sure this isn't concatenated with the last line
            console.warn(`>> [${pid}] FXServer Exited.`);
            this.history[historyIndex].timestamps.exit = now();
            txCore.webServer.webSocket.pushRefresh('status');
            if (this.history[historyIndex].timestamps.exit - this.history[historyIndex].timestamps.start <= 5) {
                setTimeout(() => {
                    console.warn('FXServer didn\'t start. This is not an issue with txAdmin.');
                }, 500);
            }
        }.bind(this));

        //Default channel handlers
        this.fxChild.stdout.on('data',
            txCore.logger.fxserver.writeFxsOutput.bind(
                txCore.logger.fxserver,
                ConsoleLineType.StdOut,
            ),
        );
        this.fxChild.stderr.on('data',
            txCore.logger.fxserver.writeFxsOutput.bind(
                txCore.logger.fxserver,
                ConsoleLineType.StdErr,
            ),
        );

        //JsonIn channel handler
        const jsoninPipe = this.fxChild.stdio[3].pipe(StreamValues.withParser());
        jsoninPipe.on('data',
            this.fd3Handler.write.bind(
                this.fd3Handler,
                this.currentMutex,
            ),
        );

        //_Almost_ don't care
        this.fxChild.stdin.on('error', chanEventBlackHole);
        this.fxChild.stdin.on('data', chanEventBlackHole);
        this.fxChild.stdout.on('error', chanEventBlackHole);
        this.fxChild.stderr.on('error', chanEventBlackHole);
        this.fxChild.stdio[3].on('error', chanEventBlackHole);

        return null;
    }


    /**
     * Restarts the FXServer
     * @param {string} reason
     * @param {string} author
     */
    async restartServer(reason = null, author = null) {
        try {
            //Restart server
            const killError = await this.killServer(reason, author, true);
            if (killError) return killError;

            //If delay override
            if (this.restartDelayOverride) {
                console.warn(`Restarting the fxserver with delay override ${this.restartDelayOverride}`);
                await sleep(this.restartDelayOverride);
            } else {
                await sleep(txConfig.fxRunner.restartDelay);
            }

            //Start server again :)
            return this.spawnServer();
        } catch (error) {
            const errMsg = `Couldn't restart the server.`;
            console.error(errMsg);
            console.verbose.dir(error);
            return errMsg;
        }
    }


    /**
     * Kills the FXServer
     * @param {string} reason
     * @param {string} author
     * @param {boolean} isRestarting
     */
    async killServer(reason = null, author = null, isRestarting = false) {
        try {
            //Prevent concurrent restart request
            const msTimestamp = Date.now();
            if (msTimestamp - this.lastKillRequest < txConfig.fxRunner.shutdownNoticeDelay * 1000) {
                return 'Restart already in progress.';
            } else {
                this.lastKillRequest = msTimestamp;
            }

            // Send warnings
            const reasonString = reason ?? 'no reason provided';
            const messageType = isRestarting ? 'restarting' : 'stopping';
            const messageColor = isRestarting ? 'warning' : 'danger';
            const tOptions = {
                servername: txConfig.global.serverName,
                reason: reasonString,
            };
            this.sendEvent('serverShuttingDown', {
                delay: txConfig.fxRunner.shutdownNoticeDelay * 1000,
                author: author ?? 'txAdmin',
                message: txCore.translator.t(`server_actions.${messageType}`, tOptions),
            });
            txCore.discordBot.sendAnnouncement({
                type: messageColor,
                description: {
                    key: `server_actions.${messageType}_discord`,
                    data: tOptions,
                },
            });

            //Awaiting restart delay
            //The 250 is so at least everyone is kicked from the server
            await sleep(250 + txConfig.fxRunner.shutdownNoticeDelay * 1000);

            //Stopping server
            if (this.fxChild !== null) {
                this.fxChild.kill();
                this.fxChild = null;
                this.history[this.history.length - 1].timestamps.kill = now();
            }
            txCore.resourcesManager.handleServerStop();
            txCore.playerlistManager.handleServerStop(this.currentMutex);
            txCore.statsManager.svRuntime.logServerClose(reasonString);
            return null;
        } catch (error) {
            const msg = `Couldn't kill the server. Perhaps What Is Dead May Never Die.`;
            console.error(msg);
            console.verbose.dir(error);
            this.fxChild = null;
            return msg;
        }
    }


    /**
     * Resets the convars in the server.
     * Useful for when we change txAdmin settings and want it to reflect on the server.
     * This will also fire the `txAdmin:event:configChanged`
     */
    resetConvars() {
        console.log('Refreshing fxserver convars.');
        try {
            const convarList = getMutableConvars(false);
            console.verbose.dir(convarList);
            for (const [set, convar, value] of convarList) {
                this.sendCommand(set, [convar, value]);
            }
            return this.sendEvent('configChanged');
        } catch (error) {
            console.verbose.error('Error resetting server convars');
            console.verbose.dir(error);
            return false;
        }
    }


    /**
     * Fires an `txAdmin:event` inside the server via srvCmd > stdin > command > lua broadcaster.
     * @param {string} eventType
     * @param {object} data
     */
    sendEvent(eventType, data = {}) {
        if (typeof eventType !== 'string' || !eventType) throw new Error('invalid eventType');
        try {
            return this.sendCommand('txaEvent', [eventType, data]);
        } catch (error) {
            console.verbose.error(`Error writing firing server event ${eventType}`);
            console.verbose.dir(error);
            return false;
        }
    }


    /**
     * Formats and sends commands to fxserver's stdin.
     * @param {string} cmdName - The name of the command to send.
     * @param {(string|number|Object)[]} [cmdArgs=[]] - The arguments for the command (optional).
     * @param {string} [author] - The author of the command (optional).
     * @returns {boolean} Success status of the command.
     */
    sendCommand(cmdName, cmdArgs = [], author) {
        if (this.fxChild === null) return false;
        if (typeof cmdName !== 'string' || !cmdName.length) throw new Error('cmdName is empty');
        if (!Array.isArray(cmdArgs)) throw new Error('cmdArgs is not an array');
        //NOTE: technically fxserver accepts anything but space and ; in the command name
        if (!/^\w+$/.test(cmdName)) {
            throw new Error('invalid cmdName string');
        }

        // Sanitize and format the command and arguments
        const sanitizeArgString = (x) => x.replaceAll(/"/g, '\uff02').replaceAll(/\n/g, ' ');
        let rawInput = sanitizeArgString(cmdName);
        for (const arg of cmdArgs) {
            if (typeof arg === 'string') {
                if (!arg.length) {
                    rawInput += ' ""';
                } else if (/^\w+$/.test(arg)) {
                    rawInput += ` ${arg}`;
                } else {
                    rawInput += ` "${sanitizeArgString(arg)}"`;
                }
            } else if (typeof arg === 'object' && arg !== null) {
                rawInput += ` "${sanitizeArgString(JSON.stringify(arg))}"`;
            } else if (typeof arg === 'number' && Number.isInteger(arg)) {
                //everything ends up as string anyways
                rawInput += ` ${arg}`;
            } else {
                throw new Error('arg expected to be string or object');
            }
        }

        // Send the command to the server
        return this.sendRawCommand(rawInput, author);
    }


    /**
     * Writes to fxchild's stdin.
     * NOTE: do not send commands with \n at the end, this function will add it.
     * @param {string} command
     * @param {string} [author]
     */
    sendRawCommand(command, author) {
        if (typeof command !== 'string') throw new Error('Expected command as String!');
        if (typeof author !== 'undefined' && typeof author !== 'string') throw new Error('Expected author as String!');
        if (this.fxChild === null) return false;
        try {
            const success = this.fxChild.stdin.write(command + '\n');
            if (author) {
                txCore.logger.fxserver.logAdminCommand(author, command);
            } else {
                txCore.logger.fxserver.logSystemCommand(command);
            }
            return success;
        } catch (error) {
            console.error('Error writing to fxChild\'s stdin.');
            console.verbose.dir(error);
            return false;
        }
    }


    /**
     * Returns the status of the server, with the states being:
     *  - not started
     *  - spawn ready
     *  - spawn awaiting last: <list of pending status of last instance>
     *  - kill pending: <list of pending events from current instance>
     *  - killed
     *  - closing
     *  - closed
     *  - spawned
     * @returns {string} status
     */
    getStatus() {
        if (!this.history.length) return 'not started';
        let curr = this.history[this.history.length - 1];

        if (!curr.timestamps.start && this.history.length == 1) {
            throw new Error('This should NOT happen. Let\'s see how long people will take to find this...');
        } else if (!curr.timestamps.start) {
            let last = this.history[this.history.length - 2];
            let pending = Object.keys(last.timestamps).filter((k) => !curr.timestamps[k]);
            if (!pending.length) {
                return 'spawn ready';
            } else {
                return 'spawn awaiting last: ' + pending.join(', ');
            }
        } else if (curr.timestamps.kill) {
            let pending = Object.keys(curr.timestamps).filter((k) => !curr.timestamps[k]);
            if (pending.length) {
                return 'kill pending: ' + pending.join(', ');
            } else {
                return 'killed';
            }
        } else if (curr.timestamps.exit && !curr.timestamps.close) {
            return 'closing';
        } else if (curr.timestamps.exit && curr.timestamps.close) {
            return 'closed';
        } else {
            return 'spawned';
        }
    }


    /**
     * Returns the current fxserver uptime in seconds
     * @returns {numeric} buffer
     */
    getUptime() {
        if (!this.history.length) return 0;
        const curr = this.history[this.history.length - 1];

        return now() - curr.timestamps.start;
    }


    /**
     * True if both the serverDataPath and cfgPath are configured
     */
    get isConfigured() {
        return Boolean(txConfig.fxRunner.serverDataPath) && Boolean(txConfig.fxRunner.cfgPath);
    }
};
