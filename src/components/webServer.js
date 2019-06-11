//Requires
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const httpServer  = require('http');
const express = require('express');
const session = require('express-session');
const rateLimit = require("express-rate-limit");
const template = require('lodash.template');
const cors = require('cors');
const bodyParser = require('body-parser');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const Webroutes = require('../webroutes');
const context = 'WebServer';

module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.session = session({
            secret: 'fxAdmin'+bcrypt.genSaltSync(),
            resave: false,
            saveUninitialized: false
        });
        this.authLimiter = rateLimit({
            windowMs: this.config.limiterMinutes * 60 * 1000, // 15 minutes
            max: this.config.limiterAttempts, // limit each IP to 5 requests per 15 minutes
            message: render('login', {
                message:`Too many login attempts, enjoy your ${this.config.limiterMinutes} minutes of cooldown.`,
                config: globals.config.configName,
                port: globals.config.fxServerPort,
                version: '--'
            })
        });
        
        this.app = express();
        this.app.use(cors());
        this.app.use(this.session);
        this.app.use(bodyParser.json());
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(express.static('public', {index: false}))
        this.setupRoutes()
        this.httpServer = httpServer.createServer(this.app);
        try {
            this.httpServer.listen(this.config.port, '0.0.0.0', () => {
                logOk(`::Started at http://${globals.config.publicIP}:${this.config.port}/`, context);
                globals.webConsole.startSocket(this.httpServer);
            })
        } catch (error) {
            logError('::Failed to start webserver with error:', context);
            dir(error);
            process.exit();
        }
    }

    
    //================================================================
    async setupRoutes(){
        //Default routes
        this.app.get('/auth', async (req, res) => {
            let renderData = {
                message: '',
                config: globals.config.configName,
                port: globals.config.fxServerPort
            }
            if(globals.version && globals.version.current){
                renderData.version = globals.version.current;
            }else{
                renderData.version = '--';
            }
            if(typeof req.query.logout !== 'undefined'){
                req.session.destroy();
                renderData.message = 'Logged Out';
                res.send(render('login', renderData));
            }else{
                res.send(render('login', renderData));
            }
        });
        this.app.post('/auth', this.authLimiter, async (req, res) => {
            if(typeof req.body.password == 'undefined'){
                req.redirect('/');
                return;
            }
            let admin = globals.authenticator.checkAuth(req.body.password);
            let renderData = {
                message: '',
                config: globals.config.configName,
                port: globals.config.fxServerPort
            }
            if(globals.version && globals.version.current){
                renderData.version = globals.version.current;
            }else{
                renderData.version = '--';
            }
            if(!admin){
                logWarn(`Wrong password from: ${req.connection.remoteAddress}`, context);
                renderData.message = 'Wrong Password!';
                res.send(render('login', renderData));
                return;
            }
            req.session.password = req.body.password;
            log(`Admin ${admin} logged in from ${req.connection.remoteAddress}`, context);
            res.redirect('/');
        });

        this.app.get('/fxControls/:action', globals.authenticator.sessionCheckerAPI, async (req, res) => {
            await Webroutes.fxControls(res, req).catch((err) => {
                this.handleRouteError(res, "[fxControls] Route Internal Error", err);
            });
        });
        this.app.post('/fxCommands', globals.authenticator.sessionCheckerWeb, async (req, res) => {
            await Webroutes.fxCommands(res, req).catch((err) => {
                this.handleRouteError(res, "[fxCommands] Route Internal Error", err);
            });
        });
        this.app.get('/getData', globals.authenticator.sessionCheckerAPI, async (req, res) => {
            await Webroutes.getData(res, req).catch((err) => {
                this.handleRouteError(res, "[getData] Route Internal Error", err);
            });
        });
        this.app.get('/checkVersion', async (req, res) => {
            res.send(globals.version);
        });
        this.app.get('/console', globals.authenticator.sessionCheckerWeb, (req, res) => {
            res.sendFile(getWebRootPath('console.html')); 
        });

        //index
        this.app.get('/', globals.authenticator.sessionCheckerWeb, (req, res) => {
            res.sendFile(getWebRootPath('index.html')); 
        });

        //Catch all
        this.app.get('*', (req, res) => {
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



//================================================================
//FIXME: temporary functions
function getWebRootPath(file){
    return path.join(__dirname, '../../public/', file);
}

function render(view, ctx = {}) {
    //https://lodash.com/docs/4.17.11#template
    return template(fs.readFileSync(getWebRootPath(view)+'.html'))(ctx)
}

const Sqrl = require("squirrelly");
const util = require('util');
const readFile = util.promisify(fs.readFile);

async function renderTemplate(view, data){
    let rawTemplate = await readFile(getWebRootPath(view)+'.html');
    return Sqrl.Render(rawTemplate.toString(), data); 
}
