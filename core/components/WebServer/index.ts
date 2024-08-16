const modulename = 'WebServer';
import crypto from 'node:crypto';
import path from 'node:path';
import HttpClass from 'node:http';

import Koa from 'koa';
import KoaBodyParser from 'koa-bodyparser';
//@ts-ignore
import KoaServe from 'koa-static';
import KoaCors from '@koa/cors';

import { Server as SocketIO } from 'socket.io';
import WebSocket from './webSocket';

import { customAlphabet } from 'nanoid';
import dict51 from 'nanoid-dictionary/nolookalikes';

import { convars, txEnv } from '@core/globalData';
import router from './router';
import consoleFactory from '@extras/console';
import TxAdmin from '@core/txAdmin';
import topLevelMw from './middlewares/topLevelMw';
import ctxVarsMw from './middlewares/ctxVarsMw';
import ctxUtilsMw from './middlewares/ctxUtilsMw';
import { SessionMemoryStorage, koaSessMw, socketioSessMw } from './middlewares/sessionMws';
import checkRateLimit from './middlewares/globalRateLimiter';
import checkHttpLoad from './middlewares/httpLoadMonitor';
import cacheControlMw from './middlewares/cacheControlMw';
const console = consoleFactory(modulename);
const nanoid = customAlphabet(dict51, 32);

//Types
export type WebServerConfigType = {
    disableNuiSourceCheck: boolean;
    limiterMinutes: number;
    limiterAttempts: number;
}

const koaServeOptions = {
    index: false,
    defer: false,
    //The resource URLs should already contain txVer as a query param to bust cache
    //so setting to 30m should be fine, except in dev mode
    maxage: !convars.isDevMode ? 30 * 60 * 1000 : 0,
};

export default class WebServer {
    readonly #txAdmin: TxAdmin;
    public isListening = false;
    private sessionCookieName: string;
    public luaComToken: string;
    //setupKoa
    private app: Koa;
    public sessionStore: SessionMemoryStorage;
    private koaCallback: (req: any, res: any) => Promise<void>;
    //setupWebSocket
    private io: SocketIO;
    public webSocket: WebSocket;
    //setupServerCallbacks
    private httpServer?: HttpClass.Server;

    constructor(txAdmin: TxAdmin, public config: WebServerConfigType) {
        this.#txAdmin = txAdmin;

        //Generate cookie key & luaComToken
        const pathHash = crypto.createHash('shake256', { outputLength: 6 })
            .update(txAdmin.info.serverProfilePath)
            .digest('hex');
        this.sessionCookieName = `tx:${txAdmin.info.serverProfile}:${pathHash}`;
        this.luaComToken = nanoid();


        // ===================
        // Setting up Koa
        // ===================
        this.app = new Koa();
        this.app.keys = ['txAdmin' + nanoid()];

        // Some people might want to enable it, but we are not guaranteeing XFF security
        // due to the many possible ways you can connect to koa.
        // this.app.proxy = true;

        //Setting up app
        this.app.on('error', (error, ctx) => {
            if (!(
                error.code?.startsWith('HPE_')
                || error.code?.startsWith('ECONN')
                || error.code === 'EPIPE'
                || error.code === 'ECANCELED'
            )) {
                console.error(`Probably harmless error on ${ctx.path}`);
                console.dir(error);
            }
        });

        //Disable CORS on dev mode
        if (convars.isDevMode) {
            this.app.use(KoaCors());
        }

        //Setting up timeout/error/no-output/413
        this.app.use(topLevelMw);

        //Setting up additional middlewares:
        const panelPublicPath = convars.isDevMode
            ? path.join(process.env.TXADMIN_DEV_SRC_PATH as string, 'panel/public')
            : path.join(txEnv.txAdminResourcePath, 'panel');
        this.app.use(KoaServe(path.join(txEnv.txAdminResourcePath, 'web/public'), koaServeOptions));
        this.app.use(KoaServe(panelPublicPath, koaServeOptions));
        this.app.use(KoaBodyParser({
            // Heavy bodies can cause v8 mem exhaustion during a POST DDoS.
            // The heaviest JSON is the /intercom/resources endpoint.
            // Conservative estimate: 768kb/300b = 2621 resources
            jsonLimit: '768kb',
        }));

        //Custom stuff
        this.sessionStore = new SessionMemoryStorage();
        this.app.use(cacheControlMw);
        this.app.use(koaSessMw(this.sessionCookieName, this.sessionStore));
        this.app.use(ctxVarsMw(txAdmin));
        this.app.use(ctxUtilsMw);

        //Setting up routes
        const txRouter = router(this.config);
        this.app.use(txRouter.routes());
        this.app.use(txRouter.allowedMethods());
        this.app.use(async (ctx) => {
            if (typeof ctx._matchedRoute === 'undefined') {
                if (ctx.path.startsWith('/legacy')) {
                    ctx.status = 404;
                    console.verbose.warn(`Request 404 error: ${ctx.path}`);
                    return ctx.send('Not found.');
                } else if (ctx.path.endsWith('.map')) {
                    ctx.status = 404;
                    return ctx.send('Not found.');
                } else {
                    return ctx.utils.serveReactIndex();
                }
            }
        });
        this.koaCallback = this.app.callback();


        // ===================
        // Setting up SocketIO
        // ===================
        this.io = new SocketIO(HttpClass.createServer(), { serveClient: false });
        this.io.use(socketioSessMw(this.sessionCookieName, this.sessionStore));
        this.webSocket = new WebSocket(this.#txAdmin, this.io);
        //@ts-ignore
        this.io.on('connection', this.webSocket.handleConnection.bind(this.webSocket));


        // ===================
        // Setting up Callbacks
        // ===================
        this.setupServerCallbacks();
    }


    /**
     * Handler for all HTTP requests
     * Note: i gave up on typing these
     */
    httpCallbackHandler(req: any, res: any) {
        //Calls the appropriate callback
        try {
            // console.debug(`HTTP ${req.method} ${req.url}`);
            if (!checkHttpLoad()) return;
            if (!checkRateLimit(req?.socket?.remoteAddress)) return; 
            if (req.url.startsWith('/socket.io')) {
                (this.io.engine as any).handleRequest(req, res);
            } else {
                this.koaCallback(req, res);
            }
        } catch (error) { }
    }


    /**
     * Setup the HTTP server callbacks
     */
    setupServerCallbacks() {
        //Just in case i want to re-execute this function
        this.isListening = false;

        //HTTP Server
        try {
            const listenErrorHandler = (error: any) => {
                if (error.code !== 'EADDRINUSE') return;
                console.error(`Failed to start HTTP server, port ${error.port} is already in use.`);
                console.error('Maybe you already have another txAdmin running in this port.');
                console.error('If you want to run multiple txAdmin instances, check the documentation for the port convar.');
                console.error('You can also try restarting the host machine.');
                process.exit(5800);
            };
            //@ts-ignore
            this.httpServer = HttpClass.createServer(this.httpCallbackHandler.bind(this));
            // this.httpServer = HttpClass.createServer((req, res) => {
            //     // const reqSize = parseInt(req.headers['content-length'] || '0');
            //     // if (req.method === 'POST' && reqSize > 0) {
            //     //     console.debug(chalk.yellow(bytes(reqSize)), `HTTP ${req.method} ${req.url}`);
            //     // }

            //     this.httpCallbackHandler(req, res);
            //     // if(checkRateLimit(req?.socket?.remoteAddress)){
            //     //     this.httpCallbackHandler(req, res);
            //     // }else {
            //     //     req.destroy();
            //     // }
            // });
            this.httpServer.on('error', listenErrorHandler);

            let iface: string;
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
            process.exit(5801);
        }
    }


    /**
     * Resetting lua comms token - called by fxRunner on spawnServer()
     */
    resetToken() {
        this.luaComToken = nanoid();
        console.verbose.log('Resetting luaComToken.');
    }
};
