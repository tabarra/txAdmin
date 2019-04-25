//Requires
const axios = require("axios");
const { log, logOk, logWarn, logError } = require('../extras/conLog');


module.exports = class Monitor {
    constructor(config, fxServer) {
        logOk('::Monitor Iniciado');
        
        this.config = config;
        this.fxServer = fxServer;
        this.context = 'Monitor';
        this.statusCache = {
            online: true,
            players: [Math.random()]
        }

        //Função Cron
        setInterval(() => {
            this.refreshCache();
        }, this.config.interval);
    }


    //================================================================
    getStatus(){
        return this.statusCache;
    }


    //================================================================
    async refreshCache(){
        //Setup do request e variáveis iniciais
        let timeStart = Date.now()
        let players = [];
        let requestOptions = {
            url: 'http://localhost:30121/players.json',
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
            this.statusCache = {
                online: false,
                ping: false,
                players: []
            }
            return;
        }

        //Save cache and print output
        this.statusCache = {
            online: true,
            ping: Date.now() - timeStart,
            players: players
        }
        log(`Players online: ${players.length}`, this.context);
    }

} //Fim Monitor()
