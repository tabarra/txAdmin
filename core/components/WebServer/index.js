const modulename = 'WebServer';
import crypto from 'node:crypto';
import path from 'node:path';
import HttpClass from 'node:http';

import Koa from 'koa';
import KoaBodyParser from 'koa-bodyparser';
import KoaServe from 'koa-static';
import KoaSession from 'koa-session';
import KoaSessionMemoryStoreClass from 'koa-session-memory';
import KoaCors from '@koa/cors';

import { Server as SocketIO } from 'socket.io';

import SessionIO from 'koa-session-socketio';
import WebSocket from './webSocket';

import { customAlphabet } from 'nanoid';
import dict51 from 'nanoid-dictionary/nolookalikes';

import { setHttpCallback } from '@citizenfx/http-wrapper';
import { convars, txEnv } from '@core/globalData';
import WebCtxUtils from './ctxUtils.js';
import router from './router';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);
const nanoid = customAlphabet(dict51, 20);


export default class WebServer {
    constructor(txAdmin, config) {
        this.txAdmin = txAdmin;
        this.config = config;
        this.luaComToken = nanoid();
        this.webSocket = null;
        this.isListening = false;
        this.httpRequestsCounter = 0;

        //Generate cookie key
        const pathHash = crypto.createHash('shake256', { outputLength: 6 })
            .update(globals.info.serverProfilePath)
            .digest('hex');
        this.koaSessionKey = `tx:${globals.info.serverProfile}:${pathHash}`;

        //Setup services
        this.setupKoa();
        this.setupWebSocket();
        this.setupServerCallbacks();

        //Counting requests per minute
        setInterval(() => {
            if(this.httpRequestsCounter > 10_000){
                const numberFormatter = new Intl.NumberFormat('en-US');
                console.majorMultilineError([
                    `txAdmin might be under a DDoS attack!`,
                    `We detected ${numberFormatter.format(this.httpRequestsCounter)} HTTP requests in the last minute.`,
                    'Make sure you have a proper firewall setup and/or a reverse proxy with rate limiting.',
                ]);
            }
            this.httpRequestsCounter = 0;
        }, 60_000);
    }


    //================================================================
    setupKoa() {
        //Start Koa
        this.app = new Koa();
        this.app.keys = ['txAdmin' + nanoid()];

        // Some people might want to enable it, but we are not guaranteeing XFF security
        // due to the many possible ways you can connect to koa.
        // this.app.proxy = true;

        //Session
        this.koaSessionMemoryStore = new KoaSessionMemoryStoreClass();
        this.sessionInstance = KoaSession({
            store: this.koaSessionMemoryStore,
            key: this.koaSessionKey,
            rolling: true,
            maxAge: 24 * 60 * 60 * 1000, //one day
        }, this.app);


        //Setting up app
        this.app.use(WebCtxUtils);
        this.app.on('error', (error, ctx) => {
            if (!(
                error.code?.startsWith('HPE_')
                || error.code?.startsWith('ECONN')
                || error.code === 'EPIPE'
                || error.code === 'ECANCELED'
            )) {
                console.error(`Probably harmless error on ${ctx.path}`);
                console.error('Please be kind and send a screenshot of this error to the txAdmin developer.');
                console.dir(error);
            }
        });

        //Disable CORS on dev mode
        if (convars.isDevMode) {
            this.app.use(KoaCors());
        }

        //Setting up timeout/error/no-output/413:
        const timeoutLimit = 35 * 1000; //REQ_TIMEOUT_REALLY_REALLY_LONG is 30s
        const jsonLimit = '16MB';
        this.app.use(async (ctx, next) => {
            ctx.set('Server', `txAdmin v${txEnv.txAdminVersion}`);
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
                    console.verbose.warn(`Route without output: ${ctx.path}`);
                    return ctx.body = '[no output from route]';
                }
            } catch (error) {
                const prefix = `[txAdmin v${txEnv.txAdminVersion}]`;
                const reqPath = (ctx.path.length > 100) ? `${ctx.path.slice(0, 97)}...` : ctx.path;
                const methodName = (error.stack && error.stack[0] && error.stack[0].name) ? error.stack[0].name : 'anonym';

                //NOTE: I couldn't force xss on path message, but just in case I'm forcing it here
                //but it is overwritten by koa when we set the body to an object, which is fine
                ctx.type = 'text/plain';
                ctx.set('X-Content-Type-Options', 'nosniff');

                //NOTE: not using HTTP logger endpoint anymore, FD3 only
                if (error.type === 'entity.too.large') {
                    const desc = `Entity too large for: ${reqPath}`;
                    console.verbose.error(desc, methodName);
                    ctx.status = 413;
                    ctx.body = { error: desc };
                } else if (ctx.state.timeout) {
                    const desc = `${prefix} Route timed out: ${reqPath}`;
                    console.error(desc, methodName);
                    ctx.status = 408;
                    ctx.body = desc;
                } else if (error.message === 'Malicious Path' || error.message === 'failed to decode') {
                    const desc = `${prefix} Malicious Path: ${reqPath}`;
                    console.verbose.error(desc, methodName);
                    ctx.status = 406;
                    ctx.body = desc;
                } else if (error.message.match(/^Unexpected token .+ in JSON at position \d+$/)) {
                    const desc = `${prefix} Invalid JSON for: ${reqPath}`;
                    console.verbose.error(desc, methodName);
                    ctx.status = 400;
                    ctx.body = { error: desc };
                } else {
                    const desc = `${prefix} Internal Error\n`
                        + `Message: ${error.message}\n`
                        + `Route: ${reqPath}\n`
                        + 'Make sure your txAdmin is updated.';
                    console.error(desc, methodName);
                    console.verbose.dir(error);
                    ctx.status = 500;
                    ctx.body = desc;
                }
            }
        });
        //Setting up additional middlewares:
        this.app.use(KoaServe(path.join(txEnv.txAdminResourcePath, 'web/public'), { index: false, defer: false }));
        this.app.use(this.sessionInstance);
        this.app.use(KoaBodyParser({ jsonLimit }));

        //Setting up routes
        this.router = router(this.config);
        this.app.use(this.router.routes());
        this.app.use(this.router.allowedMethods());
        this.app.use(async (ctx) => {
            if (typeof ctx._matchedRoute === 'undefined') {
                ctx.status = 404;
                console.verbose.warn(`Request 404 error: ${ctx.path}`);
                return ctx.utils.render('standalone/404');
            }
        });
        this.koaCallback = this.app.callback();
    }


    //================================================================
    //Resetting lua comms token - called by fxRunner on spawnServer()
    resetToken() {
        this.luaComToken = nanoid();
        console.verbose.log('Resetting luaComToken.');
    }


    //================================================================
    setupWebSocket() {
        //Start SocketIO
        this.io = new SocketIO(HttpClass.createServer(), { serveClient: false });
        this.io.use(SessionIO(this.koaSessionKey, this.koaSessionMemoryStore));

        //Setting up webSocket
        this.webSocket = new WebSocket(this.txAdmin, this.io);
        this.io.on('connection', this.webSocket.handleConnection.bind(this.webSocket));
    }


    //================================================================
    httpCallbackHandler(source, req, res) {
        //NOTE: setting the webpipe real ip is being done in WebCtxUtils
        //Rewrite source IP if it comes from nucleus reverse proxy
        const ipsrcRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:\d{1,5}$/;
        if (source == 'citizenfx' && ipsrcRegex.test(req.headers['x-cfx-source-ip'])) {
            req.connection.remoteAddress = req.headers['x-cfx-source-ip'].split(':')[0];
        }

        //Calls the appropriate callback
        try {
            this.httpRequestsCounter++;
            if (req.url.startsWith('/socket.io')) {
                this.io.engine.handleRequest(req, res);
            } else {
                this.koaCallback(req, res);
            }
        } catch (error) { }
    }


    //================================================================
    setupServerCallbacks() {
        //Just in case i want to re-execute this function
        this.isListening = false;

        //CitizenFX Callback
        try {
            setHttpCallback(this.httpCallbackHandler.bind(this, 'citizenfx'));
        } catch (error) {
            console.error('Failed to start Cfx.re Reverse Proxy Callback with error:');
            console.dir(error);
        }

        //HTTP Server
        try {
            const listenErrorHandler = (error) => {
                if (error.code !== 'EADDRINUSE') return;
                console.error(`Failed to start HTTP server, port ${error.port} already in use.`);
                console.error('Maybe you already have another txAdmin running in this port.');
                console.error('If you want to run multiple txAdmin, check the documentation for the port convar.');
                process.exit(1);
            };
            this.httpServer = HttpClass.createServer(this.httpCallbackHandler.bind(this, 'httpserver'));
            this.httpServer.on('error', listenErrorHandler);

            let iface;
            if (convars.forceInterface) {
                console.warn(`Starting with interface ${convars.forceInterface}.`);
                console.warn('If the HTTP server doesn\'t start, this is probably the reason.');
                iface = convars.forceInterface;
            } else {
                iface = '0.0.0.0';
            }

            this.httpServer.listen(convars.txAdminPort, iface, async () => {
                console.ok(`Listening on ${iface}.`);
                this.isListening = true;
            });
        } catch (error) {
            console.error('Failed to start HTTP server with error:');
            console.dir(error);
            process.exit();
        }
    }
};
