//Requires
const modulename = 'WebConsole';
const chalk = require('chalk');
const xss = require('../../extras/xss')({mark:['class']});
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const {authLogic} = require('./requestAuthenticator');

//Helpers
const getIP = (socket) => {
    return (
        socket
        && socket.request
        && socket.request.connection
        && socket.request.connection.remoteAddress
    ) ? socket.request.connection.remoteAddress : 'unknown';
};


module.exports = class webConsole {
    constructor(io) {
        this.io = io;
        this.dataBuffer = '';

        setInterval(this.flushBuffers.bind(this), 250);
    }


    //================================================================
    //NOTE: when using namespaces, call next(); at the end
    // handleConnection(socket, next)
    handleConnection(socket) {
        try {
            //Testing auth
            if (
                !socket
                || !socket.session
                || !socket.session.auth
                || !socket.session.auth.username
            ) {
                if (GlobalData.verbose) log('dropping new connection without auth', 'SocketIO');
                socket.disconnect();
            }

            //Joining room
            if (socket.handshake.query.room === 'liveconsole') {
                socket.join('liveconsole');
                socket.emit('consoleData', xss(globals.fxRunner.outputHandler.webConsoleBuffer));
            } else if (socket.handshake.query.room === 'serverlog') {
                socket.join('serverlog');
                // socket.emit('logData', xss(globals.fxRunner.xxxxxx));
            } else {
                if (GlobalData.verbose) log('dropping new connection without query.room', 'SocketIO');
                socket.disconnect();
            }

            //General events
            socket.on('disconnect', (reason) => {
                if (GlobalData.verbose) log(`Client disconnected with reason: ${reason}`, 'SocketIO');
            });
            socket.on('error', (error) => {
                if (GlobalData.verbose) log(`Socket error with message: ${error.message}`, 'SocketIO');
            });
            socket.on('consoleCommand', this.handleSocketMessages.bind(this, socket));

            log(`Connected: ${socket.session.auth.username} from ${getIP(socket)}`, 'SocketIO');
        } catch (error) {
            log(`Error handling new connection: ${error.message}`, 'SocketIO');
            socket.disconnect();
        }
    }


    //================================================================
    /**
     * Adds data to the buffer
     * @param {string} data
     * @param {string} markType
     */
    buffer(data, markType) {
        if (typeof markType === 'string') {
            this.dataBuffer += `\n<mark class="consoleMark-${markType}">${data}</mark>\n`;
        } else {
            this.dataBuffer += data;
        }
    }


    //================================================================
    /**
     * Flushes the data buffers
     * NOTE: this will also send data to users that no longer have the permission console.view
     * @param {string} data
     */
    flushBuffers() {
        if (!this.dataBuffer.length) return;

        try {
            this.io.to('liveconsole').emit('consoleData', xss(this.dataBuffer));
            this.dataBuffer = '';
        } catch (error) {
            logWarn('Message not sent');
            dir(error);
        }
    }


    //================================================================
    /**
     * Handle incoming messages.
     * Sends a command received to fxChild's stdin, logs it and broadcast the command to all other socket.io clients
     * @param {string} cmd
     */
    handleSocketMessages(socket, msg) {
        //Getting session data
        const {isValidAuth, isValidPerm} = authLogic(socket.session, 'console.write', 'socketMessage');

        //Checking Auth
        if (!isValidAuth) {
            socket.emit('logout');
            socket.session.auth = {}; //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            return;
        }

        //Check Permissions
        if (!isValidPerm) {
            let errorMessage = 'Permission \'console.write\' denied.';
            if (GlobalData.verbose) logWarn(`[${getIP(socket)}][${socket.session.auth.username}] ${errorMessage}`);
            socket.emit('consoleData', `\n<mark>${errorMessage}</mark>\n`);
            return;
        }

        //Executing command
        log(`${socket.session.auth.username} executing ` + chalk.inverse(' ' + msg + ' '), 'SocketIO');
        globals.logger.append(`[${getIP(socket)}][${socket.session.auth.username}] ${msg}`);
        globals.fxRunner.srvCmd(msg);
    }
}; //Fim webConsole()
