//Requires
const modulename = 'PlayerlistGenerator';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randIndex = (arr) => Math.floor(Math.random() * arr.length);
const unDups = (arr) => arr.filter((v,i) => arr.indexOf(v) === i)

/**
 * NOTE: This is an fake playerlist generator, intended to help me test many 
 * features without requiring actual players on the server.
 * 
 * How to use:
 *  - grab any server's /players.json and save in this folder as `playerlist.ignore.json`
 *  - the json must contain something like 45+ players
 *  - enable this require in monitor component's constructor
 */
module.exports = class PlayerlistGenerator {
    constructor(){
        //Configs
        this.config = {
            srcPlayerlist: require('./playerlist.ignore.json'),
            refreshInterval: 2500,
            shouldAddRemovePlayers: false,
            minPlayers: 2,
            maxPlayers: 7,
        }
        
        //Starting data
        this.indexes = [0,1,2,3];
        this.playerlist = [];
        
        
        //Cron functions
        setInterval(() => {
            this.playerlist = this.refreshPlayers();
        }, this.config.refreshInterval);
    }


    //================================================================
    refreshPlayers(){
        //Add and remove indexes
        if(this.config.shouldAddRemovePlayers){
            if(Math.random() < 0.5 && this.indexes.length > this.config.minPlayers){
                delete this.indexes[randIndex(this.indexes)];
            }else if(this.indexes.length < this.config.maxPlayers){
                this.indexes.push(randIndex(this.config.srcPlayerlist))
            }
        
            this.indexes = unDups(this.indexes);
        }
        
        //Fill an array with the players
        let out = [];
        this.indexes.forEach(ind => {
            out.push(this.config.srcPlayerlist[ind])
        });

        //Update player's pings
        out.forEach(p => {
            let newPing = p.ping + parseInt(Math.random() * 40) - 20;
            p.ping  = (newPing > 10)? newPing : 10;
        });

        //Returns playerlist
        return out;
    }
}
