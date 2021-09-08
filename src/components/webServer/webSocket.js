//Requires
const modulename = 'WebSocket';
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
const terminateSession = (socket) => {
    // NOTE: doing socket.session.auth = {}; would also erase the web auth
    try {
        socket.emit('goDashboard');
        socket.disconnect(0);
    } catch (error) {}
};


module.exports = class WebSocket {
    constructor(io) {
        this.io = io;
        this.dataBuffer = '';
        this.rooms = {
            liveconsole: {
                permission: 'console.view',
                eventName: 'consoleData',
                outBuffer: '',
                initialData: () => xss(globals.fxRunner.outputHandler.webConsoleBuffer),
                commands: {
                    consoleCommand: {
                        permission: 'console.write',
                        handler: (...cmdArgs) => globals.fxRunner.liveConsoleCmdHandler(...cmdArgs),
                    },
                },
            },
            serverlog: {
                permission: true, //everyone can see it
                eventName: 'logData',
                outBuffer: [],
                initialData: () => [],
                commands: {},
            },
        };

        setInterval(this.flushBuffers.bind(this), 250);
    }


    //================================================================
    //NOTE: For now the user MUST join a room, needs additional logic for 'web' room
    handleConnection(socket) {
        try {
            //Check if joining any room
            if (!socket.handshake.query.room || !Object.keys(this.rooms).includes(socket.handshake.query.room)) {
                if (GlobalData.verbose) log('dropping new connection without query.room', 'SocketIO');
                socket.disconnect(0);
            }

            //Joining room
            const roomName = socket.handshake.query.room;
            const room = this.rooms[roomName];
            const logPrefix = `SocketIO:${roomName}`;

            //Checking Auth/Perms
            const {isValidAuth, isValidPerm} = authLogic(socket.session, room.permission, logPrefix);
            if (!isValidAuth || !isValidPerm) {
                if (GlobalData.verbose) log('dropping new connection without auth or perm', logPrefix);
                //${getIP(socket)} ???
                return terminateSession(socket);
            }

            //Setting up event handlers
            Object.keys(room.commands).forEach((commandName) => {
                socket.on(commandName, (...cmdArgs) => {
                    log(`Processing ${commandName}`);
                    const {isValidAuth, isValidPerm} = authLogic(socket.session, room.commands[commandName].permission, logPrefix);
                    dir({isValidAuth, isValidPerm, perms: socket.session.auth.permissions});
                    if (!isValidAuth || !isValidPerm) {
                        if (GlobalData.verbose) log('dropping existing connection due to missing auth/permissionnew', logPrefix);
                        return terminateSession(socket);
                    }
                    room.commands[commandName].handler(socket.session, ...cmdArgs);
                });
            });

            //Sending initial data
            socket.join(roomName);
            socket.emit(room.eventName, room.initialData());

            //TODO: if web, join the web room

            //General events
            socket.on('disconnect', (reason) => {
                if (GlobalData.verbose) log(`Client disconnected with reason: ${reason}`, 'SocketIO');
            });
            socket.on('error', (error) => {
                if (GlobalData.verbose) log(`Socket error with message: ${error.message}`, 'SocketIO');
            });

            log(`Connected: ${socket.session.auth.username} from ${getIP(socket)}`, 'SocketIO');
        } catch (error) {
            log(`Error handling new connection: ${error.message}`, 'SocketIO');
            socket.disconnect();
        }
    }


    //================================================================
    /**
     * Adds data to the buffer
     * FIXME: logica de xss não é responsabilidade do websocket, devia estar no logger do fxserver
     * @param {string} roomName
     * @param {string} data
     * @param {string} markType //FIXME: remover
     */
    buffer(roomName, data, markType) {
        const room = this.rooms[roomName];
        if (!room) throw new Error('Room not found');

        if (Array.isArray(room.outBuffer)) {
            room.outBuffer.push(data);
        } else if (typeof room.outBuffer === 'string') {
            // room.outBuffer += data;
            if (typeof markType === 'string') {
                room.outBuffer += xss(`\n<mark class="consoleMark-${markType}">${data}</mark>\n`);
            } else {
                room.outBuffer += xss(data);
            }
        }
    }


    //================================================================
    /**
     * Flushes the data buffers
     * NOTE: this will also send data to users that no longer have permissions anymore
     * @param {string} data
     */
    flushBuffers() {
        Object.keys(this.rooms).forEach((roomName) => {
            const room = this.rooms[roomName];
            if (!room.outBuffer.length) return;

            this.io.to(roomName).emit(room.eventName, room.outBuffer);

            if (Array.isArray(room.outBuffer)) {
                room.outBuffer = [];
            } else if (typeof room.outBuffer === 'string') {
                room.outBuffer = '';
            }
        });
    }
}; //Fim webConsole()
