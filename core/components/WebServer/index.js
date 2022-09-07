const modulename = 'WebServer';
import crypto from 'node:crypto';
import path from 'node:path';
import HttpClass from 'node:http';

import Koa from 'koa';
import KoaBodyParser from 'koa-bodyparser';
import KoaServe from 'koa-static';
import KoaSession from 'koa-session';
import KoaSessionMemoryStoreClass from 'koa-session-memory';

import { Server as SocketIO } from 'socket.io';

import SessionIO from 'koa-session-socketio';
import WebSocket from './webSocket';

import { customAlphabet } from 'nanoid';
import dict51 from 'nanoid-dictionary/nolookalikes';

import { setHttpCallback } from '@citizenfx/http-wrapper';
import { convars, txEnv, verbose } from '@core/globalData.js';
import { requestAuth } from './requestAuthenticator.js';
import WebCtxUtils from './ctxUtils.js';
import router from './router';
import logger from '@core/extras/console.js';

const { dir, log, logOk, logWarn, logError } = logger(modulename);
const nanoid = customAlphabet(dict51, 20);


export default class WebServer {
    constructor(config) {
        this.config = config;
        this.luaComToken = nanoid();
        this.webSocket = null;
        this.isListening = false;
        this.cfxUrl = null;

        //Generate cookie key
        const pathHash = crypto.createHash('shake256', { outputLength: 6 })
            .update(globals.info.serverProfilePath)
            .digest('hex');
        this.koaSessionKey = `tx:${globals.info.serverProfile}:${pathHash}`;

        //Setup services
        this.setupKoa();
        this.setupWebSocket();
        this.setupServerCallbacks();

        //Cron function
        setInterval(() => {
            const httpCounter = globals.databus.txStatsData.httpCounter;
            httpCounter.log.push(httpCounter.current);
            if (httpCounter.log.length > 10) httpCounter.log.shift();
            if (httpCounter.current > httpCounter.max) httpCounter.max = httpCounter.current;
            httpCounter.current = 0;
        }, 60 * 1000);
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
            if (
                typeof error.code == 'string'
                && (
                    error.code.startsWith('HPE_')
                    || error.code.startsWith('ECONN')
                    || error.code.startsWith('EPIPE')
                    || error.code.startsWith('ECANCELED')
                )
            ) {
                if (verbose) {
                    logError(`Probably harmless error on ${ctx.path}`);
                    dir(error);
                }
            } else {
                logError(`Probably harmless error on ${ctx.path}`);
                logError('Please be kind and send a screenshot of this error to the txAdmin developer.');
                dir(error);
            }
        });

        //Setting up timeout/error/no-output/413:
        const timeoutLimit = 15 * 1000;
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
                    if (verbose) logWarn(`Route without output: ${ctx.path}`);
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
                    if (verbose) logError(desc, methodName);
                    ctx.status = 413;
                    ctx.body = { error: desc };
                } else if (ctx.state.timeout) {
                    const desc = `${prefix} Route timed out: ${reqPath}`;
                    logError(desc, methodName);
                    ctx.status = 408;
                    ctx.body = desc;
                } else if (error.message === 'Malicious Path' || error.message === 'failed to decode') {
                    const desc = `${prefix} Malicious Path: ${reqPath}`;
                    if (verbose) logError(desc, methodName);
                    ctx.status = 406;
                    ctx.body = desc;
                } else if (error.message.match(/^Unexpected token .+ in JSON at position \d+$/)) {
                    const desc = `${prefix} Invalid JSON for: ${reqPath}`;
                    if (verbose) logError(desc, methodName);
                    ctx.status = 400;
                    ctx.body = { error: desc };
                } else {
                    const desc = `${prefix} Internal Error\n`
                        + `Message: ${error.message}\n`
                        + `Route: ${reqPath}\n`
                        + 'Make sure your txAdmin is updated.';
                    logError(desc, methodName);
                    if (verbose) dir(error);
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
                if (verbose) logWarn(`Request 404 error: ${ctx.path}`);
                return ctx.utils.render('standalone/404');
            }
        });
        this.koaCallback = this.app.callback();
    }


    //================================================================
    //Resetting lua comms token - called by fxRunner on spawnServer()
    resetToken() {
        this.luaComToken = nanoid();
        if (verbose) log('Resetting luaComToken.');
    }


    //================================================================
    setupWebSocket() {
        //Start SocketIO
        this.io = new SocketIO(HttpClass.createServer(), { serveClient: false });
        this.io.use(SessionIO(this.koaSessionKey, this.koaSessionMemoryStore));
        this.io.use(requestAuth('socket'));

        //Setting up webSocket
        this.webSocket = new WebSocket(this.io);
        this.io.on('connection', this.webSocket.handleConnection.bind(this.webSocket));
        //NOTE: when using namespaces:
        // this.io.on('connection', client => {
        //     logError('Triggered when not using any type of namespace.')
        // });
        // this.io.of('/console').use(this.webSocket.handleConnection.bind(this.webSocket));
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
            globals.databus.txStatsData.httpCounter.current++;
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

        //FIXME: in update v4.18.0 we hid the cfx.re proxy url, if nobody complains deprecate the proxy entirely
        //Print cfx.re url... when available
        const validUrlRegex = /\.users\.cfx\.re$/i;
        const getUrlInterval = setInterval(() => {
            try {
                const urlConvar = GetConvar('web_baseUrl', 'false');
                if (validUrlRegex.test(urlConvar)) {
                    // logOk(`Cfx.re URL: https://${urlConvar}/`);
                    this.cfxUrl = urlConvar;
                    clearInterval(getUrlInterval);
                }
            } catch (error) { }
        }, 500);

        //CitizenFX Callback
        try {
            setHttpCallback(this.httpCallbackHandler.bind(this, 'citizenfx'));
        } catch (error) {
            logError('Failed to start Cfx.re Reverse Proxy Callback with error:');
            dir(error);
        }

        //HTTP Server
        try {
            const listenErrorHandler = (error) => {
                if (error.code !== 'EADDRINUSE') return;
                logError(`Failed to start HTTP server, port ${error.port} already in use.`);
                logError('Maybe you already have another txAdmin running in this port.');
                logError('If you want to run multiple txAdmin, check the documentation for the port convar.');
                process.exit();
            };
            this.httpServer = HttpClass.createServer(this.httpCallbackHandler.bind(this, 'httpserver'));
            this.httpServer.on('error', listenErrorHandler);

            let iface;
            if (convars.forceInterface) {
                logWarn(`Starting with interface ${convars.forceInterface}.`);
                logWarn('If the HTTP server doesn\'t start, this is probably the reason.');
                iface = convars.forceInterface;
            } else {
                iface = '0.0.0.0';
            }

            this.httpServer.listen(convars.txAdminPort, iface, async () => {
                logOk(`Listening on ${iface}.`);
                this.isListening = true;
            });
        } catch (error) {
            logError('Failed to start HTTP server with error:');
            dir(error);
            process.exit();
        }
    }
};
