const modulename = 'FXRunner';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgsStringToArgv } from 'string-argv';
import StreamValues from 'stream-json/streamers/StreamValues';

import { convars, txEnv } from '@core/globalData';
import { validateFixServerConfig } from '@core/extras/fxsConfigHelper';
import { now } from '@extras/helpers';
import Fd3Handler from './fd3Handler';

import { customAlphabet } from 'nanoid/non-secure';
import dict49 from 'nanoid-dictionary/nolookalikes';
import consoleFactory from '@extras/console';
import { ConsoleLineType } from '@core/components/Logger/FXServerLogger';
const console = consoleFactory(modulename);
const genMutex = customAlphabet(dict49, 5);


//Helpers
const escape = (x) => x.toString().replace(/"/g, '\uff02');
const formatCommand = (cmd, ...params) => {
    return `${cmd} "` + [...params].map(escape).join('" "') + '"';
};
const getMutableConvars = (isCmdLine = false) => {
    const playerDbConfigs = globals.playerDatabase.config;
    const checkPlayerJoin = (playerDbConfigs.onJoinCheckBan || playerDbConfigs.whitelistMode !== 'disabled');

    //type, name, value
    const convars = [
        ['set', 'txAdmin-serverName', globals.txAdmin.globalConfig.serverName ?? 'txAdmin'],
        ['setr', 'txAdmin-locale', globals.translator.language ?? 'en'],
        ['set', 'txAdmin-localeFile', globals.translator.customLocalePath ?? 'false'],
        ['setr', 'txAdmin-verbose', console.isVerbose],
        ['set', 'txAdmin-checkPlayerJoin', checkPlayerJoin],
        ['set', 'txAdmin-menuAlignRight', globals.txAdmin.globalConfig.menuAlignRight],
        ['set', 'txAdmin-menuPageKey', globals.txAdmin.globalConfig.menuPageKey],
        ['set', 'txAdmin-hideAdminInPunishments', globals.txAdmin.globalConfig.hideAdminInPunishments],
        ['set', 'txAdmin-hideAdminInMessages', globals.txAdmin.globalConfig.hideAdminInMessages],
        ['set', 'txAdmin-hideDefaultAnnouncement', globals.txAdmin.globalConfig.hideDefaultAnnouncement],
        ['set', 'txAdmin-hideDefaultDirectMessage', globals.txAdmin.globalConfig.hideDefaultDirectMessage],
        ['set', 'txAdmin-hideDefaultWarning', globals.txAdmin.globalConfig.hideDefaultWarning],
        ['set', 'txAdmin-hideDefaultScheduledRestartWarning', globals.txAdmin.globalConfig.hideDefaultScheduledRestartWarning],
    ];

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

export default class FXRunner {
    constructor(txAdmin, config) {
        this.config = config;

        //Checking config validity
        if (this.config.shutdownNoticeDelay < 0 || this.config.shutdownNoticeDelay > 30) {
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
        this.fd3Handler = new Fd3Handler(txAdmin);
    }


    /**
     * Refresh fxRunner configurations
     */
    refreshConfig() {
        this.config = globals.configVault.getScoped('fxRunner');
    }


    /**
     * Receives the signal that all the start banner was already printed and other modules loaded
     */
    signalStartReady() {
        if (!this.config.autostart) return;

        if (this.config.serverDataPath === null || this.config.cfgPath === null) {
            return console.warn('Please open txAdmin on the browser to configure your server.');
        }

        if (!globals.adminVault?.hasAdmins()) {
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
        if (typeof this.config.commandLine === 'string' && this.config.commandLine.length) {
            extraArgs = parseArgsStringToArgv(this.config.commandLine);
        }

        // Prepare default args (these convars can't change without restart)
        const txAdminInterface = (convars.forceInterface)
            ? `${convars.forceInterface}:${convars.txAdminPort}`
            : `127.0.0.1:${convars.txAdminPort}`;
        const cmdArgs = [
            getMutableConvars(true),
            extraArgs,
            '+set', 'onesync', this.config.onesync,
            '+sets', 'txAdmin-version', txEnv.txAdminVersion,
            '+setr', 'txAdmin-menuEnabled', globals.txAdmin.globalConfig.menuEnabled,
            '+set', 'txAdmin-luaComHost', txAdminInterface,
            '+set', 'txAdmin-luaComToken', globals.webServer.luaComToken,
            '+set', 'txAdminServerMode', 'true', //Can't change this one due to fxserver code compatibility
            '+exec', this.config.cfgPath,
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
        globals.webServer.resetToken();
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
        if (this.config.serverDataPath === null || this.config.cfgPath === null) {
            const msg = `Cannot start the server with missing configuration (serverDataPath || cfgPath).`;
            console.error(msg);
            return msg;
        }

        //Validating server.cfg & configuration
        try {
            const result = await validateFixServerConfig(this.config.cfgPath, this.config.serverDataPath);
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
        globals.healthMonitor.resetMonitorStats();

        //Resetting frontend playerlist
        globals.webServer.webSocket.buffer('playerlist', {
            mutex: this.currentMutex,
            type: 'fullPlayerlist',
            playerlist: [],
        });

        //Announcing
        if (announce === 'true' || announce === true) {
            globals.discordBot.sendAnnouncement({
                type: 'success',
                description: {
                    key: 'server_actions.spawning_discord',
                    data: { servername: globals.txAdmin.globalConfig.serverName },
                },
            });
        }

        //Starting server
        let pid;
        let historyIndex;
        try {
            this.fxChild = spawn(
                this.spawnVariables.command,
                this.spawnVariables.args,
                {
                    cwd: this.config.serverDataPath,
                    stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
                },
            );
            if (typeof this.fxChild.pid === 'undefined') {
                throw new Error(`Executon of "${this.spawnVariables.command}" failed.`);
            }
            pid = this.fxChild.pid.toString();
            console.ok(`>> [${pid}] FXServer Started!`);
            globals.logger.fxserver.logFxserverBoot(pid);
            this.history.push({
                pid,
                timestamps: {
                    start: now(),
                    kill: false,
                    exit: false,
                    close: false,
                },
            });
            historyIndex = this.history.length - 1;
            globals.webServer?.webSocket.pushRefresh('status');
        } catch (error) {
            console.error('Failed to start FXServer with the following error:');
            console.dir(error);
            process.exit(5400);
        }

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
            globals.webServer?.webSocket.pushRefresh('status');
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
            globals.webServer?.webSocket.pushRefresh('status');
            if (this.history[historyIndex].timestamps.exit - this.history[historyIndex].timestamps.start <= 5) {
                setTimeout(() => {
                    console.warn('FXServer didn\'t start. This is not an issue with txAdmin.');
                }, 500);
            }
        }.bind(this));

        //Default channel handlers
        this.fxChild.stdout.on('data',
            globals.logger.fxserver.writeFxsOutput.bind(
                globals.logger.fxserver,
                ConsoleLineType.StdOut,
            ),
        );
        this.fxChild.stderr.on('data',
            globals.logger.fxserver.writeFxsOutput.bind(
                globals.logger.fxserver,
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
                await sleep(this.config.restartDelay);
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
            if (msTimestamp - this.lastKillRequest < this.config.shutdownNoticeDelay * 1000) {
                return 'Restart already in progress.';
            } else {
                this.lastKillRequest = msTimestamp;
            }

            // Send warnings
            const reasonString = reason ?? 'no reason provided';
            const messageType = isRestarting ? 'restarting' : 'stopping';
            const messageColor = isRestarting ? 'warning' : 'danger';
            const tOptions = {
                servername: globals.txAdmin.globalConfig.serverName,
                reason: reasonString,
            };
            this.sendEvent('serverShuttingDown', {
                delay: this.config.shutdownNoticeDelay * 1000,
                author: author ?? 'txAdmin',
                message: globals.translator.t(`server_actions.${messageType}`, tOptions),
            });
            globals.discordBot.sendAnnouncement({
                type: messageColor,
                description: {
                    key: `server_actions.${messageType}_discord`,
                    data: tOptions,
                },
            });

            //Awaiting restart delay
            //The 250 is so at least everyone is kicked from the server
            await sleep(250 + this.config.shutdownNoticeDelay * 1000);

            //Stopping server
            if (this.fxChild !== null) {
                this.fxChild.kill();
                this.fxChild = null;
                this.history[this.history.length - 1].timestamps.kill = now();
            }
            globals.resourcesManager.handleServerStop();
            globals.playerlistManager.handleServerStop(this.currentMutex);
            globals.statsManager.svRuntime.logServerClose(reasonString);
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
        if (typeof eventType !== 'string') throw new Error('Expected eventType as String!');
        try {
            const eventCommand = formatCommand(
                'txaEvent',
                eventType,
                JSON.stringify(data),
            );
            // console.verbose.dir({ eventType, data});
            return this.srvCmd(eventCommand);
        } catch (error) {
            console.verbose.error(`Error writing firing server event ${eventType}`);
            console.verbose.dir(error);
            return false;
        }
    }


    /**
     * Formats and sends commands to fxserver's stdin.
     * @param {string} cmdName - The name of the command to send.
     * @param {(string|Object)[]} [cmdArgs=[]] - The arguments for the command (optional).
     * @param {string} [author] - The author of the command (optional).
     * @returns {boolean} Success status of the command.
     */
    sendCommand(cmdName, cmdArgs = [], author) {
        if (this.fxChild === null) return false;
        if (typeof cmdName !== 'string' || !cmdName.length) throw new Error('cmdName is empty');
        if (!Array.isArray(cmdArgs)) throw new Error('cmdArgs is not an array');

        // Sanitize and format the command and arguments
        const sanitizeArgString = (x) => x.replaceAll(/"/g, '\uff02').replaceAll(/\n/g, ' ');
        const rawInputParts = [sanitizeArgString(cmdName)];
        for (const arg of cmdArgs) {
            let argAsString;
            if (typeof arg === 'string') {
                argAsString = arg;
            } else if (typeof arg === 'object' && arg !== null) {
                argAsString = JSON.stringify(arg);
            } else {
                throw new Error('arg expected to be string or object');
            }
            rawInputParts.push(`"${sanitizeArgString(argAsString)}"`);
        }

        // Send the command to the server
        try {
            const rawInputString = rawInputParts.join(' ');
            const success = this.fxChild.stdin.write(rawInputString + '\n');
            if (author) {
                globals.logger.fxserver.logAdminCommand(author, rawInputString);
            } else {
                globals.logger.fxserver.logSystemCommand(rawInputString);
            }
            return success;
        } catch (error) {
            console.verbose.error('Error sending command to fxChild.stdin');
            console.verbose.dir(error);
            return false;
        }
    }


    /**
     * Pipe a string into FXServer's stdin (aka executes a cfx's command)
     * TODO: make this method accept an array and apply the formatCommand() logic
     * @param {string} command
     */
    srvCmd(command, author) {
        if (typeof command !== 'string') throw new Error('Expected String!');
        if (this.fxChild === null) return false;
        const sanitized = command.replaceAll(/\n/g, ' ');
        try {
            const success = this.fxChild.stdin.write(sanitized + '\n');
            if (author) {
                globals.logger.fxserver.logAdminCommand(author, sanitized);
            } else {
                globals.logger.fxserver.logSystemCommand(sanitized);
            }
            return success;
        } catch (error) {
            console.verbose.error('Error writing to fxChild.stdin');
            console.verbose.dir(error);
            return false;
        }
    }


    /**
     * Handles a live console command input
     * @param {import('../WebServer/authLogic').AuthedAdminType} admin
     * @param {string} command
     */
    liveConsoleCmdHandler(admin, command) {
        admin.logCommand(command, 'command');
        globals.fxRunner.srvCmd(command, admin.name);
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
        let curr = this.history[this.history.length - 1];

        return now() - curr.timestamps.start;
    }
};
