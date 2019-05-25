//Requires
const fs = require('fs');
const bcrypt = require('bcrypt');
const httpServer  = require('http');
const express = require('express');
const session = require('express-session');
const template = require('lodash.template');
const path = require('path');
const cors = require('cors');
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

        this.app = express();
        this.httpServer = httpServer.createServer(this.app);
        this.app.use(cors());
        this.app.use(this.session);
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(express.static('public', {index: false}))
        this.setupRoutes()
        try {
            this.httpServer.listen(this.config.port, '0.0.0.0', () => {
                logOk(`::Started at http://${globals.config.publicIP}:${this.config.port}/`, context);
                globals.webConsole.startSocket(this.httpServer);
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
        this.app.get('/auth', async (req, res) => {
            // res.sendFile(getWebRootPath('login.html')); 
            if(typeof req.query.logout !== 'undefined'){
                req.session.destroy();
                res.send(render('login', {message:'Logged Out'}));
            }else{
                res.send(render('login', {message:''}));
            }
        });
        this.app.post('/auth', async (req, res) => {
            if(typeof req.body.password == 'undefined'){
                req.redirect('/');
                return;
            }
            let admin = globals.authenticator.checkAuth(req.body.password);
            if(!admin){
                logWarn(`Wrong password from: ${req.connection.remoteAddress}`, context);
                res.send(render('login', {message:'Wrong Password'}));
                return;
            }
            req.session.password = req.body.password;
            log(`Admin ${admin} logged in from ${req.connection.remoteAddress}`, context);
            res.redirect('/');
        });

        this.app.get('/test', globals.authenticator.sessionCheckerWeb, async (req, res) => {
            res.send('<pre>'+JSON.stringify(req.session, null, 2)+'</pre>'); 
        });

        this.app.post('/action', globals.authenticator.sessionCheckerWeb, async (req, res) => {
            await Webroutes.action(res, req).catch((err) => {
                this.handleRouteError(res, "[action] Route Internal Error", err);
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
function getWebRootPath(file){
    return path.join(__dirname, '../../public/', file);
}

function render(view, ctx = {}) {
    //https://lodash.com/docs/4.17.11#template
    return template(fs.readFileSync(getWebRootPath(view)+'.html'))(ctx)
}
