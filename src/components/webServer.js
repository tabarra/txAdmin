//Requires
const express = require('express');
const cors = require('cors');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const Webroutes = require('../webroutes');
const context = 'WebServer';

module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.app = express()
        this.app.use(cors());
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(express.static('public'))
        this.setupRoutes()
        try {
            this.app.listen(this.config.port, () => {
                logOk(`::Started at http://${globals.config.publicIP}:${this.config.port}/`, context);
            })
        } catch (error) {
            logError('::Failed to start webserver with error:', context);
            dir(error);
            process.exit(1);
        }
    }

    
    //================================================================
    async setupRoutes(){
        //Default routes
        this.app.post('/action', async (req, res) => {
            await Webroutes.action(res, req).catch((err) => {
                this.handleRouteError(res, "[action] Route Internal Error", err);
            });
        });
        this.app.get('/getData', async (req, res) => {
            await Webroutes.getData(res, req).catch((err) => {
                this.handleRouteError(res, "[getData] Route Internal Error", err);
            });
        });
        this.app.get('/checkVersion', async (req, res) => {
            res.send(globals.version);
        });

        //Catch all
        this.app.get('*', function(req, res){
            res.redirect('/');
        });
    }


    //================================================================
    handleRouteError(res, desc, error){
        logError(desc, `${context}:route`);
        dir(error)
        res.status(500);
        res.send(desc);
    }

} //Fim WebServer()


