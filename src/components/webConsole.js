//Requires
const SocketIO = require('socket.io');

const xssClass = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const {requestAuth, authLogic} = require('./webServer/requestAuthenticator');
const context = 'webConsole';
const contextSocket = 'webConsole:SocketIO';

//Set custom xss rules
const xss = new xssClass.FilterXSS({
    whiteList: {
        mark: ['class']
    }
});



module.exports = class webConsole {
    constructor(config) {
        logOk('::Awaiting', context);
        this.io = null;
        this.dataBuffer = '';

        //Start SocketIO
        this.io = new SocketIO({
            pingInterval: 5000
        });
        this.io.use(sharedsession(globals.webServer.session));
        this.io.use(requestAuth('socket').bind(this));
        this.io.on('connection', (socket) => {
            try {
                log(`Connected: ${socket.handshake.session.auth.username} from ${socket.handshake.address}`, contextSocket);
            } catch (error) {
                log(`Connected: new connection with unknown source`, contextSocket);
            }

            socket.on('disconnect', (reason) => {
                if(globals.config.verbose) log(`Client disconnected with reason: ${reason}`, contextSocket);
            });
            socket.on('error', (error) => {
                if(globals.config.verbose) log(`Socket error with message: ${error.message}`, contextSocket);
            });
            socket.on('consoleCommand', this.handleSocketMessages.bind(this, socket));

            try {
                socket.emit('consoleData', xss.process(globals.fxRunner.consoleBuffer.webConsoleBuffer));
            } catch (error) {
                if(globals.config.verbose) logWarn(`Error sending sending old buffer: ${error.message}`, context);
            }
        });

        setInterval(this.flushBuffer.bind(this), 250);
    }


    //================================================================
    /**
     * Attach the Socket.IO to a http server
     * @param {object} socketInterface
     */
    attachSocket(socketInterface){
        try {
            this.io.attach(socketInterface);
            let port = socketInterface.address().port;
            logOk(`::Listening on port ${port}.`, context);
        } catch (error) {
            logError('::Failed to attach to http interface with error:', context);
            dir(error);
        }
    }


    //================================================================
    /**
     * Adds data to the buffer
     * @param {string} data
     * @param {string} markType
     */
    buffer(data, markType){
        if(typeof markType === 'string'){
            this.dataBuffer += `\n<mark class="consoleMark-${markType}">${data}</mark>\n`;
        }else{
            this.dataBuffer += data;
        }
    }


    //================================================================
    /**
     * Flushes the data buffer
     * NOTE: this will also send data to users that no longer have the permission console.view
     * @param {string} data
     */
    flushBuffer(){
        if(!this.dataBuffer.length) return;
        try {
            this.io.emit('consoleData', xss.process(this.dataBuffer));
            this.dataBuffer = '';
        } catch (error) {
            logWarn('Message not sent', context);
            dir(error)
        }
    }


    //================================================================
    /**
     * Handle incoming messages.
     * Sends a command received to fxChild's stdin, logs it and broadcast the command to all other socket.io clients
     * @param {string} cmd
     */
    handleSocketMessages(socket, msg){
        //Getting session data
        const {isValidAuth, isValidPerm} = authLogic(socket.handshake.session, 'console.write', context);

        //Checking Auth
        if(!isValidAuth){
            socket.emit('logout');
            socket.handshake.session.auth = {}; //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            return;
        }

        //Check Permissions
        if(!isValidPerm){
            let errorMessage = `Permission 'console.write' denied.`;
            if(globals.config.verbose) logWarn(`[${socket.handshake.address}][${socket.handshake.session.auth.username}] ${errorMessage}`, context);
            socket.emit('consoleData', `\n<mark>${errorMessage}</mark>\n`);
            return;
        }

        //Executing command
        log(`Executing: '${msg}'`, contextSocket);
        globals.fxRunner.srvCmd(msg);
        globals.logger.append(`[${socket.handshake.address}][${socket.handshake.session.auth.username}] ${msg}`);
    }

} //Fim webConsole()
