const modulename = 'PlayerlistGenerator';
import fs from 'node:fs';
import got from 'got'
import logger from '@core/extras/console.js';
import { convars } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helpers
const randIndex = (arr) => Math.floor(Math.random() * arr.length);
const unDups = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

/**
 * NOTE: This is an fake playerlist generator, intended to help me test many
 * features without requiring actual players on the server.
 *
 * How to use:
 *  - grab any server's /players.json and save in this folder as `playerlist.ignore.json`
 *  - the json must contain something like 45+ players
 *  - enable this require in monitor component's constructor
 */
export default class PlayerlistGenerator {
    constructor() {
        throw new Error('Disabled, for now');
        //Configs
        const srcPath = './src/components/playerController/playerlist.ignore.json';
        this.config = {
            srcPlayerlist: JSON.parse(fs.readFileSync(srcPath)),
            // refreshInterval: 2*60*1000,
            refreshInterval: 10 * 1000,
            shouldAddRemovePlayers: true,
            minPlayers: 7,
            maxPlayers: 15,
        };

        //Starting data
        this.indexes = [0, 1, 2, 3, 4, 5, 6, 7];
        this.playerlist = [];
        const refreshFunc = (convars.debugExternalSource)
            ? this.refreshPlayersExternal.bind(this)
            : this.refreshPlayersStatic.bind(this);

        //Cron functions
        refreshFunc();
        setInterval(refreshFunc, this.config.refreshInterval);
    }


    //================================================================
    async refreshPlayersExternal() {
        try {
            this.playerlist = await got(`http://${convars.debugExternalSource}/players.json`).json();
        } catch (error) {
            logError(`External source failed: ${error.message}`);
        }
    }

    //================================================================
    refreshPlayersStatic() {
        //Add and remove indexes
        if (this.config.shouldAddRemovePlayers) {
            if (Math.random() < 0.5 && this.indexes.length > this.config.minPlayers) {
                delete this.indexes[randIndex(this.indexes)];
            } else if (this.indexes.length < this.config.maxPlayers) {
                this.indexes.push(randIndex(this.config.srcPlayerlist));
            }

            this.indexes = unDups(this.indexes);
        }

        //Fill an array with the players
        let out = [];
        this.indexes.forEach((ind) => {
            out.push(this.config.srcPlayerlist[ind]);
        });

        //Update player's pings
        out.forEach((p) => {
            let newPing = p.ping + parseInt(Math.random() * 40) - 20;
            p.ping = (newPing > 10) ? newPing : 10;
        });

        //Sets playerlist
        this.playerlist = out;
    }
};
