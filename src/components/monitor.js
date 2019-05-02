//Requires
const axios = require("axios");
const pidusage = require('pidusage');
const bigInt = require("big-integer");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');


module.exports = class Monitor {
    constructor(config) {
        logOk('::Monitor Iniciado');
        
        this.config = config;
        this.context = 'Monitor';
        this.statusProcess = false;
        this.statusServer = {
            online: false,
            players: []
        }

        //Função Cron
        setInterval(() => {
            this.refreshServerStatus();
            this.refreshProcessStatus();
            // logError("Data:\n"+JSON.stringify(this.getStatus(), null, 2));
        }, this.config.interval);
    }


    //================================================================
    /**
     * Getter for the status object.
     * @returns {object} object containing .process and .server
     */
    getStatus(){
        return {
            process: this.statusProcess,
            server: this.statusServer
        }
    }


    //================================================================
    /**
     * Refreshes the Server Status.
     */
    async refreshServerStatus(){
        //Setup do request e variáveis iniciais
        let timeStart = Date.now()
        let players = [];
        let requestOptions = {
            // url: `http://localhost:${this.config.fxServerPort}/players.json`,
            url: `http://wpg.gg:${this.config.fxServerPort}/players.json`,
            method: 'get',
            responseType: 'json',
            responseEncoding: 'utf8',
            maxRedirects: 0,
            timeout: this.config.timeout
        }

        //Fazer request
        try {
            const res = await axios(requestOptions);
            players = res.data;
            if(!Array.isArray(players)) throw new Error("not array")
        } catch (error) {
            logError(`Server error: ${error.message}`, this.context);
            this.statusServer = {
                online: false,
                ping: false,
                players: []
            }
            return;
        }

        //Remove identifiers and add steam profile link
        players.forEach(player => {
            player.identifiers.forEach((identifier, index) => {
                if(identifier.startsWith('steam:')){
                    try {
                        let decID = new bigInt(identifier.slice(6), 16).toString(); 
                        player.steam = `https://steamcommunity.com/profiles/${decID}`;
                    } catch (error) {}
                }
            });
            delete player.identifiers;
            delete player.endpoint;
            delete player.id; //Usefull if we are going to kick/ban player. Well, maybe...
        });

        //Save cache and print output
        this.statusServer = {
            online: true,
            ping: Date.now() - timeStart,
            players: players
        }
        if(globals.config.verbose) log(`Players online: ${players.length}`, this.context);
    }


    //================================================================
    /**
     * Refreshes the Process Status.
     */
    async refreshProcessStatus(){
        try {
            let pidData = await pidusage(globals.fxServer.fxChild.pid);
            this.statusProcess = {
                cpu: pidData.cpu,
                memory: pidData.memory,
                uptime: pidData.elapsed,
                ctime: pidData.ctime
            }
        } catch (error) {
            this.statusProcess = false;
        }
    }


} //Fim Monitor()
