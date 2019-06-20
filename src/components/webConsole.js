//Requires
const socketio = require('socket.io');
const sharedsession = require("express-socket.io-session");
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'webConsole';
const contextSocket = 'webConsole:SocketIO';

module.exports = class webConsole {
    constructor(config) {
        logOk('::Awaiting', context);
        this.io = null;
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
        this.io.use(this.authNewSession.bind(this));
        this.io.on('connection', (socket) => {
            log(`Connected: ${socket.id}`, contextSocket);
            socket.on('disconnect', (reason) => {
                log(`Client disconnected with reason: ${reason}`, contextSocket);
            });
            socket.on('error', (error) => {
                log(`Socket error with message: ${error.message}`, contextSocket);
            });
            socket.on('evntMessage', this.handleSocketMessages.bind(this, socket));
        });
    }


    //================================================================
    /**
     * Authenticates a new session to make sure the credentials are valid and set the admin variable.
     * @param {object} socket 
     * @param {function} next 
     */
    authNewSession(socket, next){
        let follow = false;
        if(
            typeof socket.handshake.session.auth !== 'undefined' &&
            typeof socket.handshake.session.auth.username !== 'undefined' &&
            typeof socket.handshake.session.auth.password !== 'undefined'
        ){
            let admin = globals.authenticator.checkAuth(socket.handshake.session.auth.username, socket.handshake.session.auth.password);
            if(admin){
                socket.handshake.session.auth = {
                    username: socket.handshake.session.auth.username,
                    password: socket.handshake.session.auth.password,
                    permissions: admin.permissions
                };
                follow = true;
            }
        }

        if(!follow){
            socket.handshake.session.destroy(); //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            if(globals.config.verbose) logWarn('Auth error when creating session', context);
            next(new Error('Authentication Error'));
        }else{
            next();
        }
    };


    //================================================================
    /**
     * Authenticates a new session to make sure the credentials are valid and set the admin variable.
     * @param {*} socket 
     * @returns {boolean}
     */
    checkSessionAuth(socket){
        let isValid = false;
        if(
            typeof socket.handshake.session.auth !== 'undefined' &&
            typeof socket.handshake.session.auth.username !== 'undefined' &&
            typeof socket.handshake.session.auth.password !== 'undefined'
        ){
            let admin = globals.authenticator.checkAuth(socket.handshake.session.auth.username, socket.handshake.session.auth.password);
            if(admin){
                socket.handshake.session.auth = {
                    username: socket.handshake.session.auth.username,
                    password: socket.handshake.session.auth.password,
                    permissions: admin.permissions
                };
                isValid = true;
            }
        }

        return isValid;
    };


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
     * Handle incoming messages.
     * Sends a command received to fxChild's stdin, logs it and broadcast the command to all other socket.io clients
     * @param {string} cmd 
     */
    handleSocketMessages(socket, msg){
        let authCheck = this.checkSessionAuth(socket);
        if(!authCheck){
            socket.emit('logout');
            socket.handshake.session.destroy(); //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            return;
        }
        
        log(`Executing: '${msg}'`, contextSocket);
        globals.fxRunner.srvCmd(msg);
        globals.logger.append(`[${socket.handshake.address}][${socket.handshake.session.auth.username}] ${msg}`);
    }

} //Fim webConsole()
