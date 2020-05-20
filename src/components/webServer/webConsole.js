//Requires
const modulename = 'WebConsole';
const ac = require('ansi-colors');
const xss = require('../../extras/xss')({mark:['class']});
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const {authLogic} = require('./requestAuthenticator');

//Helpers
const getIP = (socket) => {
    return (
        socket &&
        socket.request && 
        socket.request.connection && 
        socket.request.connection.remoteAddress
    )? socket.request.connection.remoteAddress : 'unknown';
}


module.exports = class webConsole {
    constructor(io) {
        this.io = io;
        this.dataBuffer = '';

        setInterval(this.flushBuffer.bind(this), 250);
    }


    //================================================================
    handleConnection(socket){
        try {
            log(`Connected: ${socket.session.auth.username} from ${getIP(socket)}`, 'SocketIO');
        } catch (error) {
            log(`Connected: new connection with unknown source`, 'SocketIO');
        }

        socket.on('disconnect', (reason) => {
            if(GlobalData.verbose) log(`Client disconnected with reason: ${reason}`, 'SocketIO');
        });
        socket.on('error', (error) => {
            if(GlobalData.verbose) log(`Socket error with message: ${error.message}`, 'SocketIO');
        });
        socket.on('consoleCommand', this.handleSocketMessages.bind(this, socket));

        try {
            socket.emit('consoleData', xss(globals.fxRunner.consoleBuffer.webConsoleBuffer));
        } catch (error) {
            if(GlobalData.verbose) logWarn(`Error sending sending old buffer: ${error.message}`);
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
            this.io.emit('consoleData', xss(this.dataBuffer));
            this.dataBuffer = '';
        } catch (error) {
            logWarn('Message not sent');
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
        const {isValidAuth, isValidPerm} = authLogic(socket.session, 'console.write', 'socketMessage');

        //Checking Auth
        if(!isValidAuth){
            socket.emit('logout');
            socket.session.auth = {}; //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            return;
        }

        //Check Permissions
        if(!isValidPerm){
            let errorMessage = `Permission 'console.write' denied.`;
            if(GlobalData.verbose) logWarn(`[${getIP(socket)}][${socket.session.auth.username}] ${errorMessage}`);
            socket.emit('consoleData', `\n<mark>${errorMessage}</mark>\n`);
            return;
        }
        
        //Executing command
        log(`Executing ` + ac.inverse(' ' + msg + ' '), 'SocketIO');
        globals.fxRunner.srvCmd(msg);
        globals.logger.append(`[${getIP(socket)}][${socket.session.auth.username}] ${msg}`);
    }

} //Fim webConsole()
