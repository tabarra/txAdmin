//Requires
const modulename = 'WebServer';
const HttpClass  = require('http');

const Koa = require('koa');
const KoaBodyParser = require('koa-bodyparser');
const KoaServe = require('koa-static');
const KoaSession = require('koa-session');
const KoaSessionMemoryStoreClass = require('koa-session-memory');

const SocketIO = require('socket.io');
const SessionIO = require('koa-session-socketio')
const WebConsole = require('./webConsole')

const nanoid = require('nanoid');
const { setHttpCallback } = require('@citizenfx/http-wrapper');
const { dir, log, logOk, logWarn, logError} = require('../../extras/console')(modulename);
const {requestAuth} = require('./requestAuthenticator');
const ctxUtils = require('./ctxUtils.js');


module.exports = class WebServer {
    constructor(config, httpPort) {
        this.config = config;
        this.httpPort = httpPort; //NOTE: remove when adding support for multi-server
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
            logError(`Strange error on ${ctx.path}`);
            dir(error)
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
                    if(globals.config.verbose) logWarn(`Route without output: ${ctx.path}`);
                    return ctx.body = '[no output from route]';
                }
            } catch (error) {
                //TODO: perhaps we should also have a koa-bodyparser generic error handler?
                //FIXME: yes we should - sending broken json will cause internal server error even without the route being called
                let methodName = (error.stack && error.stack[0] && error.stack[0].name)? error.stack[0].name : 'anonym';
                if(error.type === 'entity.too.large'){
                    let desc = `Entity too large for: ${ctx.path}`;
                    if(globals.config.verbose) logError(desc, methodName);
                    ctx.status = 413;
                    ctx.body = {error: desc};
                }else if (ctx.state.timeout){
                    let desc = `Route timed out: ${ctx.path}`;
                    logError(desc, methodName);
                    ctx.status = 408;
                    ctx.body = desc;
                }else{
                    let desc = `Internal Error on: ${ctx.path}`;
                    logError(desc, methodName);
                    if(globals.config.verbose) dir(error)
                    ctx.status = 500;
                    ctx.body = desc;
                }
            }
        });
        //Setting up additional middlewares:
        this.app.use(KoaServe(path.join(GetResourcePath(GetCurrentResourceName()), 'web/public'), {index: false, defer: false}));
        this.app.use(this.sessionInstance);
        this.app.use(KoaBodyParser({jsonLimit}));

        //Setting up routes
        this.router = require('./router')(this.config);
        this.app.use(this.router.routes())
        this.app.use(this.router.allowedMethods());
        // this.app.use(async (ctx, next) => {
        //     ctx.body = Date.now()
        //     // return async () => {
        //     //     ctx.body = Date.now()
        //     // }
        // });
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

        //Debug only
        // setInterval(() => {
        //     try {
        //         this.io.emit('changeBodyColor', '#'+(Math.random()*0xFFFFFF<<0).toString(16).toUpperCase());
        //     } catch (error) {}
        // }, 1000);
    }


    //================================================================
    httpCallbackHandler(req, res){
        let prefix = '';
        try {
            if(req.url.startsWith(prefix+'/socket.io')){
                this.io.engine.handleRequest(req, res);
            }else{
                this.koaCallback(req, res);
            }
        } catch (error) {}
    }


    //================================================================
    setupServerCallbacks(){
        //CitizenFX Callback
        try {
            setHttpCallback(this.httpCallbackHandler.bind(this));
        } catch (error) {
            logError('::Failed to start CitizenFX Reverse Proxy Callback with error:');
            dir(error);
        }

        //HTTP Server
        try {
            this.httpServer = HttpClass.createServer(this.httpCallbackHandler.bind(this));
            this.httpServer.on('error', (error)=>{
                if(error.code !== 'EADDRINUSE') return;
                logError(`Failed to start HTTP server, port ${error.port} already in use.`);
                process.exit();
            });
            this.httpServer.listen(this.httpPort, '0.0.0.0', () => {
                logOk(`::Started at http://localhost:${this.httpPort}/`);
            });
        } catch (error) {
            logError('::Failed to start HTTP server with error:');
            dir(error);
            process.exit();
        }
    }

} //Fim WebServer()
