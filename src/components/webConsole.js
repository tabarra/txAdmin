//Requires
const socketio = require('socket.io');
const sharedsession = require("express-socket.io-session");
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'webConsole';

module.exports = class webConsole {
    constructor(config) {
        logOk('::Awaiting', context);
        this.io = null;

        //debug only
        setInterval(() => {
            //this.broadcast(Math.random().toString().repeat(Math.random()*3));
        }, 700);
    }


    //================================================================
    /**
     * Starts the Socket.IO server
     * @param {object} httpServer 
     */
    startSocket(httpServer){
        logOk('::Started', context);
        this.io = socketio.listen(httpServer, {
            pingInterval: 5000
        });
        this.io.use(sharedsession(globals.webServer.session));
        this.io.use(globals.authenticator.sessionCheckerSocket);
        this.io.on('connection', (socket) => {
            log(`[SOCKET.IO] Connected: ${socket.id}`, context);
            socket.on('disconnect', (reason) => {
                log(`[SOCKET.IO] Client disconnected with reason: ${reason}`, context);
            });
            socket.on('evntMessage', (msg) => {
                log(`[SOCKET.IO] Message '${msg}' from '${socket.id}'`);
                this.runCFXCommand(msg);
            });
        });
    }


    //================================================================
    /**
     * Sends a message to all clients
     * @param {string} msg 
     */
    broadcast(data, isInput){
        let msg = (isInput)? `\n<mark>${xss(data)}</mark>\n` : xss(data);
        try {
            this.io.emit('evntMessage', msg);
        } catch (error) {
            logWarn('Message not sent', context);
        }
    }


    //================================================================
    /**
     * Sends a command received to fxChild's stdin, logs it and broadcast the command to all other socket.io clients
     * @param {string} cmd 
     */
    runCFXCommand(cmd){
        //FIXME: add real authentication
        globals.logger.append(`[CONSOLE] ${cmd}`);
        globals.fxRunner.srvCmd(cmd);
    }

} //Fim webConsole()
