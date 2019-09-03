//Requires
const fs = require('fs')
const httpServer  = require('http');
const httpsServer  = require('https');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const nanoid = require('nanoid');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('../../webroutes/webUtils');
const context = 'WebServer';

module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.intercomToken = nanoid();

        this.setupExpress();
        this.setupServers();
    }


    //================================================================
    setupExpress(){
        this.session = session({
            secret: 'txAdmin'+nanoid(),
            name: `txAdmin.${globals.config.serverProfile}.sid`,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            maxAge: 24*60*60*1000 //one day
        });

        this.app = express();

        //Setting up middlewares
        this.app.use(function(req, res, next){
            res.setTimeout(5000, function(){
                let desc = `Route timed out: ${req.originalUrl}`;
                logError(desc, context);
                return res.status(500).send(desc);
            });
            next();
        });
        this.app.use(this.session);
        this.app.use(cors());
        this.app.use(bodyParser.json({limit: '16MB'}));
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(express.static('web/public', {index: false}))
        this.app.use((error, req, res, next)=>{
            logError(`Middleware error on: ${req.originalUrl} : ${error.message}`)
            if(error.type === 'entity.too.large'){
                return res.status(413).send({error: 'request entity too large'});
            }else{
                return res.status(500).send({error: 'middleware error'});
            }
        });

        //Setting up routes
        this.router = require('./router')(this.config);
        this.app.use(this.router);
        this.app.get('*', (req, res) => {
            if(globals.config.verbose) logWarn(`Request 404 error: ${req.originalUrl}`, context);
            res.status(404).sendFile(webUtils.getWebViewPath('basic/404'));
        });
    }


    //================================================================
    setupServers(){
        //HTTP Server
        try {
            this.httpServer = httpServer.createServer(this.app);
            this.httpServer.on('error', (error)=>{
                if(error.code !== 'EADDRINUSE') return;
                logError(`Failed to start HTTP server, port ${error.port} already in use.`, context);
                process.exit();
            })
            this.httpServer.listen(this.config.port, '0.0.0.0', () => {
                logOk(`::Started at http://localhost:${this.config.port}/`, context);
                globals.webConsole.attachSocket(this.httpServer);
            })
        } catch (error) {
            logError('::Failed to start HTTP server with error:', context);
            dir(error);
            process.exit();
        }


        //HTTPS Server
        if(this.config.enableHTTPS){
            try {
                let httpsServerOptions = {
                    key: fs.readFileSync('data/key.pem'),
                    cert: fs.readFileSync('data/cert.pem'),
                }
                this.httpsServer = httpsServer.createServer(httpsServerOptions, this.app);
                this.httpsServer.on('error', (error)=>{
                    if(error.code !== 'EADDRINUSE') return;
                    logError(`Failed to start HTTPS server, port ${error.port} already in use.`, context);
                    process.exit();
                })
                this.httpsServer.listen(this.config.httpsPort, '0.0.0.0', () => {
                    logOk(`::Started at https://localhost:${this.config.httpsPort}/`, context);
                    globals.webConsole.attachSocket(this.httpsServer);
                })
            } catch (error) {
                logError('::Failed to start HTTPS server with error:', context);
                dir(error);
                process.exit();
            }
        }
    }

} //Fim WebServer()
