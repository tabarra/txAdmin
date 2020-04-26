/**
 * NOTE: This is an fake playerlist generator, intended to help me test many 
 * features without requiring actual players on the server.
 * 
 * How to use:
 *  - grab any server's /players.json and save in this folder as `playerlist.ignore.json`
 *  - the json must contain something like 45+ players
 *  - enable this require in monitor component's constructor
 */

//Requires
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')('PlayerlistGenerator');
const srcPlayerlist = require('./playerlist.ignore.json')

//Helpers
const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randIndex = (arr) => Math.floor(Math.random() * arr.length);
const unDups = (arr) => arr.filter((v,i) => arr.indexOf(v) === i)

//Configs
const minPlayers = 5;
const maxPlayers = 45;
const refreshInterval = 2500;
let indexes = [1,2,3,4,5,6,7,8,9,10];

//Routine
setInterval(() => {
    if(Math.random() < 0.5 && indexes.length > minPlayers){
        delete indexes[randIndex(indexes)];
    }else if(indexes.length < maxPlayers){
        indexes.push(randIndex(srcPlayerlist))
    }

    indexes = unDups(indexes);
    
    let out = [];
    indexes.forEach(ind => {
        out.push(srcPlayerlist[ind])
    });
    out.forEach(p => {
        let newPing = p.ping + parseInt(Math.random() * 40) - 20;
        p.ping  = (newPing > 10)? newPing : 10;
    });
    globals.databus.debugPlayerlist = out;
}, refreshInterval);

