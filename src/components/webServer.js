//Requires
const bcrypt = require('bcrypt');
const httpServer  = require('http');
const express = require('express');
const session = require('express-session');
const rateLimit = require("express-rate-limit");
const bodyParser = require('body-parser');
const cors = require('cors');
const nanoid = require('nanoid');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('../webroutes/webUtils');
const webRoutes = require('../webroutes');
const context = 'WebServer';

module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.intercomToken = nanoid();
        this.session = session({
            secret: 'txAdmin'+nanoid(),
            name: `txAdmin.${globals.config.serverProfile}.sid`,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            maxAge: 24*60*60*1000 //one day
        });
        this.authLimiter = rateLimit({
            windowMs: this.config.limiterMinutes * 60 * 1000, // 15 minutes
            max: this.config.limiterAttempts, // limit each IP to 5 requests per 15 minutes
            message: `Too many login attempts, enjoy your ${this.config.limiterMinutes} minutes of cooldown.`
        });

        this.app = express();
        this.app.use(cors());
        this.app.use(this.session);
        this.app.use(bodyParser.json());
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(express.static('web/public', {index: false}))
        this.setupRoutes()
        this.httpServer = httpServer.createServer(this.app);
        this.httpServer.on('error', (error)=>{
            if(error.code !== 'EADDRINUSE') return;
            logError(`Failed to start webserver, port ${error.port} already in use.`, context);
            process.exit();
        })
        try {
            this.httpServer.listen(this.config.port, '0.0.0.0', () => {
                logOk(`::Started at http://localhost:${this.config.port}/`, context);
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
        //FIXME: reorganize routes
        //Auth routes
        this.app.get('/auth', async (req, res) => {
            let message = '';
            if(typeof req.query.logout !== 'undefined'){
                req.session.destroy();
                message = 'Logged Out';
            }
            let out = await webUtils.renderLoginView(message);
            return res.send(out);
        });
        this.app.post('/auth', this.authLimiter, async (req, res) => {
            if(typeof req.body.username === 'undefined' || typeof req.body.password === 'undefined'){
                req.redirect('/');
                return;
            }
            let message = '';

            let admin = globals.authenticator.checkAuth(req.body.username, req.body.password);
            if(!admin){
                logWarn(`Wrong password for from: ${req.connection.remoteAddress}`, context);
                message = 'Wrong Password!';
                let out = await webUtils.renderLoginView(message);
                return res.send(out);
            }
            req.session.auth = {
                username: admin.name,
                password: req.body.password,
                permissions: admin.permissions
            };
            log(`Admin ${admin.name} logged in from ${req.connection.remoteAddress}`, context);
            res.redirect('/');
        });

        //Control routes
        this.app.get('/fxControls/:action', getAuthFunc('api'), async (req, res) => {
            await webRoutes.fxControls(res, req).catch((err) => {
                this.handleRouteError(res, "[fxControls] Route Internal Error", err);
            });
        });
        this.app.post('/fxCommands', getAuthFunc('web'), async (req, res) => {
            await webRoutes.fxCommands(res, req).catch((err) => {
                this.handleRouteError(res, "[fxCommands] Route Internal Error", err);
            });
        });
        this.app.get('/console', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getConsole(res, req).catch((err) => {
                this.handleRouteError(res, "[getConsole] Route Internal Error", err);
            });
        });
        this.app.post('/saveSettings/:scope', getAuthFunc('web'), async (req, res) => {
            await webRoutes.saveSettings(res, req).catch((err) => {
                this.handleRouteError(res, "[saveSettings] Route Internal Error", err);
            });
        });
        this.app.post('/adminManager/:action', getAuthFunc('web'), async (req, res) => {
            await webRoutes.adminManagerActions(res, req).catch((err) => {
                this.handleRouteError(res, "[adminManagerActions] Route Internal Error", err);
            });
        });
        this.app.post('/intercom/:scope', getAuthFunc('intercom'), async (req, res) => {
            await webRoutes.intercom(res, req).catch((err) => {
                this.handleRouteError(res, "[intercom] Route Internal Error", err);
            });
        });

        //Data routes
        this.app.get('/adminLog', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getAdminLog(res, req).catch((err) => {
                this.handleRouteError(res, "[getAdminLog] Route Internal Error", err);
            });
        });
        this.app.get('/fullReport', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getFullReport(res, req).catch((err) => {
                this.handleRouteError(res, "[getFullReport] Route Internal Error", err);
            });
        });
        this.app.get('/getStatus', getAuthFunc('api'), async (req, res) => {
            await webRoutes.getStatus(res, req).catch((err) => {
                this.handleRouteError(res, "[getStatus] Route Internal Error", err);
            });
        });
        this.app.get('/getPlayerData/:id', getAuthFunc('api'), async (req, res) => {
            await webRoutes.getPlayerData(res, req).catch((err) => {
                this.handleRouteError(res, "[getPlayerData] Route Internal Error", err);
            });
        });
        this.app.get('/downloadLog', getAuthFunc('web'), async (req, res) => {
            await webRoutes.downloadLog(res, req).catch((err) => {
                this.handleRouteError(res, "[downloadLog] Route Internal Error", err);
            });
        });

        //Index & generic
        this.app.get('/', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getDashboard(res, req).catch((err) => {
                this.handleRouteError(res, "[getDashboard] Route Internal Error", err);
            });
        });
        this.app.get('/settings', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getSettings(res, req).catch((err) => {
                this.handleRouteError(res, "[getSettings] Route Internal Error", err);
            });
        });
        this.app.get('/adminManager', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getAdminManager(res, req).catch((err) => {
                this.handleRouteError(res, "[getAdminManager] Route Internal Error", err);
            });
        });
        this.app.get('/addExtension', getAuthFunc('web'), async (req, res) => {
            await webRoutes.getAddExtension(res, req).catch((err) => {
                this.handleRouteError(res, "[getAddExtension] Route Internal Error", err);
            });
        });

        //Catch all
        this.app.get('*', (req, res) => {
            res.status(404);
            res.sendFile(webUtils.getWebViewPath('404'));
        });
    }


    //================================================================
    handleRouteError(res, desc, error){
        try {
            logError(desc, `${context}:route`);
            dir(error)
            res.status(500);
            res.send(desc);
        } catch (error) {}
    }

} //Fim WebServer()



//================================================================
/**
 * Returns a session authenticator function
 * @param {*} type
 */
function getAuthFunc(type){
    //Intercom auth function
    const intercomAuth = (req, res, next) => {
        if(
            typeof req.body.txAdminToken !== 'undefined' &&
            req.body.txAdminToken === globals.webServer.intercomToken
        ){
            next();
        }else{
            res.send({error: 'invalid token'})
        }
    }

    //Normal auth function
    const normalAuth = (req, res, next) =>{
        let follow = false;
        if(
            typeof req.session.auth !== 'undefined' &&
            typeof req.session.auth.username !== 'undefined' &&
            typeof req.session.auth.password !== 'undefined'
        ){
            let admin = globals.authenticator.checkAuth(req.session.auth.username, req.session.auth.password);
            if(admin){
                req.session.auth = {
                    username: req.session.auth.username,
                    password: req.session.auth.password,
                    permissions: admin.permissions
                };
                follow = true;
            }
        }

        if(!follow){
            if(globals.config.verbose) logWarn(`Invalid session auth: ${req.originalUrl}`, context);
            if(type === 'web'){
                return res.redirect('/auth?logout');
            }else if(type === 'api'){
                return res.send({logout:true});
            }else{
                return () => {throw new Error('Unknown auth type')};
            }
        }else{
            next();
        }
    }

    //Return the appropriate function
    if(type === 'intercom'){
        return intercomAuth;
    }else if(type === 'web'){
        return normalAuth;
    }else if(type === 'api'){
        return normalAuth;
    }else{
        return () => {throw new Error('Unknown auth type')};
    }
}
