//Requires
const modulename = 'WebServer';
const HttpClass  = require('http');

const Koa = require('koa');
const KoaBodyParser = require('koa-bodyparser');
const KoaServe = require('koa-static');
const KoaSession = require('koa-session');
const KoaSessionMemoryStoreClass = require('koa-session-memory');

const SocketIO = require('socket.io');
const SessionIO = require('koa-session-socketio');
const WebConsole = require('./webConsole');

const { customAlphabet } = require('nanoid');
const dict51 = require('nanoid-dictionary/nolookalikes');
const nanoid = customAlphabet(dict51, 20);

const chalk = require('chalk');
const { setHttpCallback } = require('@citizenfx/http-wrapper');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const {requestAuth} = require('./requestAuthenticator');
const ctxUtils = require('./ctxUtils.js');


module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.intercomToken = nanoid();
        this.koaSessionKey = `txAdmin:${globals.info.serverProfile}:sess`;
        this.webConsole = null;

        this.setupKoa();
        this.setupWebsocket();
        this.setupServerCallbacks();
    }


    //================================================================
    setupKoa(){
        //Start Koa
        this.app = new Koa();
        this.app.keys = ['txAdmin'+nanoid()];

        //Session
        this.koaSessionMemoryStore = new KoaSessionMemoryStoreClass();
        this.sessionInstance = KoaSession({
            store: this.koaSessionMemoryStore,
            key: this.koaSessionKey,
            rolling: true,
            maxAge: 24*60*60*1000 //one day
        }, this.app);


        //Setting up app
        this.app.use(ctxUtils);
        this.app.on('error', (error, ctx) => {
            if(
                typeof error.code == 'string' && 
                (
                    error.code.startsWith('HPE_') || 
                    error.code.startsWith('ECONN') ||
                    error.code.startsWith('EPIPE') || 
                    error.code.startsWith('ECANCELED') 
                )
            ){
                if(GlobalData.verbose){
                    logError(`Probably harmless error on ${ctx.path}`);
                    dir(error);
                }
            }else{
                logError(`Probably harmless error on ${ctx.path}`);
                logError('Please be kind and send a screenshot of this error to the txAdmin developer.');
                dir(error)
            }
        });
        
        //Setting up timeout/error/no-output/413:
        let timeoutLimit = 5 * 1000;
        let jsonLimit = '16MB';
        this.app.use(async (ctx, next) => {
            let timer; 
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => {
                    ctx.state.timeout = true;
                    reject(new Error());
                }, timeoutLimit);
            });
            try {
                await Promise.race([timeout, next()]);
                clearTimeout(timer);
                if (typeof ctx.body == 'undefined' || (typeof ctx.body == 'string' && !ctx.body.length)) {
                    if(GlobalData.verbose) logWarn(`Route without output: ${ctx.path}`);
                    return ctx.body = '[no output from route]';
                }
            } catch (error) {
                //TODO: perhaps we should also have a koa-bodyparser generic error handler?
                //FIXME: yes we should - sending broken json will cause internal server error even without the route being called
                const methodName = (error.stack && error.stack[0] && error.stack[0].name)? error.stack[0].name : 'anonym';
                if(error.type === 'entity.too.large'){
                    const desc = `Entity too large for: ${ctx.path}`;
                    if(GlobalData.verbose) logError(desc, methodName);
                    ctx.status = 413;
                    ctx.body = {error: desc};
                }else if (ctx.state.timeout){
                    const desc = `[txAdmin v${GlobalData.txAdminVersion}] Route timed out: ${ctx.path}`;
                    logError(desc, methodName);
                    ctx.status = 408;
                    ctx.body = desc;
                }else{
                    const desc = `[txAdmin v${GlobalData.txAdminVersion}] Internal Error\n` +
                                 `Message: ${error.message}\n` +
                                 `Route: ${ctx.path}\n` +
                                 `Make sure your txAdmin is updated.`;
                    logError(desc, methodName);
                    if(GlobalData.verbose) dir(error)
                    ctx.status = 500;
                    ctx.body = desc;
                }
            }
        });
        //Setting up additional middlewares:
        this.app.use(KoaServe(path.join(GlobalData.txAdminResourcePath, 'web/public'), {index: false, defer: false}));
        this.app.use(this.sessionInstance);
        this.app.use(KoaBodyParser({jsonLimit}));

        //Setting up routes
        this.router = require('./router')(this.config);
        this.app.use(this.router.routes())
        this.app.use(this.router.allowedMethods());
        this.app.use(async (ctx) => {
            if(typeof ctx._matchedRoute === 'undefined'){
                ctx.status = 404;
                if(GlobalData.verbose) logWarn(`Request 404 error: ${ctx.path}`);
                return ctx.utils.render('basic/404');
            }
        })
        this.koaCallback = this.app.callback();
    }


    //================================================================
    setupWebsocket(){
        //Start SocketIO
        this.io = SocketIO(HttpClass.createServer(), { serveClient: false });
        this.io.use(SessionIO(this.koaSessionKey, this.koaSessionMemoryStore))
        this.io.use(requestAuth('socket'));

        //Setting up WebConsole
        this.webConsole = new WebConsole(this.io);
        this.io.on('connection', this.webConsole.handleConnection.bind(this.webConsole));
    }


    //================================================================
    httpCallbackHandler(source, req, res){
        //Rewrite source ip if it comes from nucleus reverse proxy
        const ipsrcRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:\d{1,5}$/
        if(source == 'citizenfx' && ipsrcRegex.test(req.headers['x-cfx-source-ip'])){
            req.connection.remoteAddress = req.headers['x-cfx-source-ip'].split(':')[0];
        }

        //Calls the appropriate callback
        try {
            if(req.url.startsWith('/socket.io')){
                this.io.engine.handleRequest(req, res);
            }else{
                this.koaCallback(req, res);
            }
        } catch (error) {}
    }


    //================================================================
    setupServerCallbacks(){
        //Print cfx.re url... when available
        //NOTE: perhaps open the URL automatically with the `open` library
        let validUrlRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}\.users\.cfx\.re$/i
        let getUrlInterval = setInterval(() => {
            try {
                let urlConvar = GetConvar('web_baseUrl', 'false');
                if(validUrlRegex.test(urlConvar)){
                    logOk(`Listening at ` + chalk.inverse(` https://${urlConvar}/ `));
                    GlobalData.cfxUrl = urlConvar;
                    clearInterval(getUrlInterval);
                }
            } catch (error) {}
        }, 500);

        //CitizenFX Callback
        try {
            setHttpCallback(this.httpCallbackHandler.bind(this, 'citizenfx'));
        } catch (error) {
            logError('Failed to start CitizenFX Reverse Proxy Callback with error:');
            dir(error);
        }

        //HTTP Server
        try {
            this.httpServer = HttpClass.createServer(this.httpCallbackHandler.bind(this, 'httpserver'));
            this.httpServer.on('error', (error)=>{
                if(error.code !== 'EADDRINUSE') return;
                logError(`Failed to start HTTP server, port ${error.port} already in use.`);
                process.exit();
            });
            this.httpServer.listen(GlobalData.txAdminPort, '0.0.0.0', () => {
                const addr = (GlobalData.osType === 'linux')? 'your-public-ip' : 'localhost';
                logOk(`Listening at ` + chalk.inverse(` http://${addr}:${GlobalData.txAdminPort}/ `));
                if(
                    globals.authenticator &&
                    globals.authenticator.admins === false &&
                    GlobalData.osType === 'windows'
                ){
                    const open = require('open');
                    try {
                        open(`http://${addr}:${GlobalData.txAdminPort}/`);
                    } catch (error) {}
                }
            });
        } catch (error) {
            logError('Failed to start HTTP server with error:');
            dir(error);
            process.exit();
        }
    }

} //Fim WebServer()
