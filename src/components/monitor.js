//Requires
const axios = require("axios");
const pidusageTree = require('pidusage-tree')
const bigInt = require("big-integer");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Monitor';


module.exports = class Monitor {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.statusProcess = false;
        this.statusAllProcess = false;
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
            server: this.statusServer,
            extra: {
                allProcesses: this.statusAllProcess,
                configs: {
                    //TODO: todo?
                }
            }
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
            url: `http://localhost:${this.config.fxServerPort}/players.json`,
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
            logWarn(`Server error: ${error.message}`, context);
            this.statusServer = {
                online: false,
                ping: false,
                players: []
            }
            return;
        }

        //Remove identifiers and add steam profile link
        players.forEach(player => {
            player.identifiers.forEach((identifier) => {
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
        if(globals.config.verbose) log(`Players online: ${players.length}`, context);
    }


    //================================================================
    /**
     * Refreshes the Processes Statuses.
     */
    async refreshProcessStatus(){
        try {
            var processes = await pidusageTree(process.pid);
            let combined = {
                count: 0,
                cpu: 0,
                memory: 0,
                uptime: null
            }
            let individual = {}

            //Foreach PID
            Object.keys(processes).forEach((pid) => {
                var curr = processes[pid];

                //combined
                combined.count += 1;
                combined.cpu += curr.cpu;
                combined.memory += curr.memory;
                if(combined.uptime === null || combined.uptime > curr.elapsed) combined.uptime = curr.elapsed;

                //individual
                individual[pid] = {
                    cpu: curr.cpu,
                    memory: curr.memory,
                    uptime: curr.elapsed
                }
            });
            this.statusProcess = combined;
            this.statusAllProcess = individual;
        } catch (error) {
            if(globals.config.verbose){
                logWarn('Error refreshing processes statuses', context);
                dir(error);
            }
            this.statusProcess = false;
            this.statusAllProcess = false;
        }
    }


} //Fim Monitor()
