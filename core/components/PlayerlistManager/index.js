const modulename = 'PlayerlistManager';
import ActivePlayer from './ActivePlayer.class';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


//DEBUG
const {Console} = require('node:console');
const ogConsole = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});


export default class PlayerlistManager {
    constructor() {
        this.playerlist = [];
    }


    /**
     * Handler for all txAdminPlayerlistEvent structured trace events
     * @param {*} payload
     */
    handleServerEvents(payload) {
        if (payload.event === 'playerJoining') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (typeof this.playerlist[payload.id] !== 'undefined') throw new Error(`duplicated player id`);
                this.playerlist[payload.id] = new ActivePlayer(payload.id, payload.player);
                ogConsole.log(this.playerlist[payload.id]);
            } catch (error) {
                if (verbose) logWarn(`Invalid playerJoining event: ${error.message}`);
            }
        } else if (payload.event === 'playerDropped') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (this.playerlist[payload.id] === 'undefined') throw new Error(`player id not found`);
                this.playerlist[payload.id].drop(payload.reason);
            } catch (error) {
                if (verbose) logWarn(`Invalid playerDropped event: ${error.message}`);
            }
        } else {
            logWarn(`Invalid event: ${payload?.event}`);
        }
    }


    /**
     * Handler for server restart
     */
    handleServerStop() {
        //TODO:
    }
};
