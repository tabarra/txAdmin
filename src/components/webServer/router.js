//Requires
const modulename = 'WebServer:Router';
const Router = require('@koa/router');
const KoaRateLimit = require('koa-ratelimit');

const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const webRoutes = require('../../webroutes');
const {requestAuth} = require('./requestAuthenticator');


/**
 * Router factory
 * @param {object} config
 */
module.exports = (config) => {
    const router = new Router();
    const authLimiter = KoaRateLimit({
        driver: 'memory',
        db: new Map(),
        duration: config.limiterMinutes * 60 * 1000, // 15 minutes
        errorMessage: `<html>
                <head>
                    <title>txAdmin Rate Limit</title>
                    <style>
                        body {
                            background-color: #171718;
                            color: orangered;
                            text-align: center; 
                            margin-top: 6em; 
                            font-family: monospace;
                        }
                    </style>
                </head>
                <body>
                    <h1>Too many attempts, enjoy your ${config.limiterMinutes} minutes of cooldown.</h1>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/otCpCn0l4Wo?start=15" frameborder="0" allow="accelerometer; autoplay="1"; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </body>
            </html>`,
        max: config.limiterAttempts,
        disableHeader: true,
        id: (ctx) => ctx.txVars.realIP,
    });
    const authLimiterNUI = KoaRateLimit({
        driver: 'memory',
        db: new Map(),
        max: 50,
        duration: 5 * 60 * 1000,
        errorMessage: JSON.stringify({isAdmin: false, reason: 'too many requests'}),
        disableHeader: true,
        id: (ctx) => ctx.txVars.realIP,
    });
    const chartDataLimiter = KoaRateLimit({
        driver: 'memory',
        db: new Map(),
        max: 10,
        duration: 30 * 1000,
        errorMessage: JSON.stringify({failReason: 'rate_limiter'}),
        disableHeader: true,
        id: (ctx) => ctx.txVars.realIP,
    });

    //Authentication
    router.get('/auth', webRoutes.auth.get);
    router.all('/auth/addMaster/:action', authLimiter, webRoutes.auth.addMaster);
    router.get('/auth/:provider/redirect', authLimiter, webRoutes.auth.providerRedirect);
    router.get('/auth/:provider/callback', authLimiter, webRoutes.auth.providerCallback);
    router.get('/auth/zap', authLimiter, webRoutes.auth.verifyZapToken);
    router.get('/auth/nui', authLimiterNUI, webRoutes.auth.verifyNuiAuth);
    router.post('/auth/password', authLimiter, webRoutes.auth.verifyPassword);
    router.post('/changePassword', requestAuth('web'), webRoutes.auth.changePassword);

    //Admin Manager
    router.get('/adminManager', requestAuth('web'), webRoutes.adminManager.get);
    router.post('/adminManager/:action', requestAuth('web'), webRoutes.adminManager.actions);

    //Settings
    router.get('/setup', requestAuth('web'), webRoutes.setup.get);
    router.post('/setup/:action', requestAuth('api'), webRoutes.setup.post);
    router.get('/deployer', requestAuth('web'), webRoutes.deployer.stepper);
    router.get('/deployer/status', requestAuth('api'), webRoutes.deployer.status);
    router.post('/deployer/recipe/:action', requestAuth('api'), webRoutes.deployer.actions);
    router.get('/settings', requestAuth('web'), webRoutes.settings.get);
    router.post('/settings/save/:scope', requestAuth('web'), webRoutes.settings.save);

    //Master Actions
    router.get('/masterActions/:resource', requestAuth('web'), webRoutes.masterActions.get);
    router.post('/masterActions/:action', requestAuth('web'), webRoutes.masterActions.actions);

    //FXServer
    router.get('/fxserver/controls/:action', requestAuth('api'), webRoutes.fxserver.controls); //FIXME: transform into post
    router.post('/fxserver/commands', requestAuth('web'), webRoutes.fxserver.commands);
    router.get('/fxserver/downloadLog', requestAuth('web'), webRoutes.fxserver.downloadLog);

    //CFG Editor
    router.get('/cfgEditor', requestAuth('web'), webRoutes.cfgEditor.get);
    router.post('/cfgEditor/save', requestAuth('api'), webRoutes.cfgEditor.save);

    //Control routes
    router.get('/console', requestAuth('web'), webRoutes.liveConsole);
    router.post('/intercom/:scope', requestAuth('intercom'), webRoutes.intercom);

    //Diagnostic routes
    router.get('/diagnostics', requestAuth('web'), webRoutes.diagnostics);
    router.get('/advanced', requestAuth('web'), webRoutes.advanced.get);
    router.post('/advanced', requestAuth('api'), webRoutes.advanced.actions); //FIXME: add action to URL

    //Data routes
    router.get('/txAdminLog', requestAuth('web'), webRoutes.txAdminLog);
    router.get('/serverLog/:offset?', requestAuth('web'), webRoutes.serverLog); //FIXME: param fix due to missing search
    router.get('/status/:scope?', requestAuth('api'), webRoutes.status); //FIXME: param fix due to missing search
    router.get('/chartData/:thread?', chartDataLimiter, webRoutes.chartData); //FIXME: param fix due to missing search

    //Player routes
    router.get('/player/list', requestAuth('web'), webRoutes.player.list);
    router.get('/player/:reference', requestAuth('api'), webRoutes.player.modal);
    router.post('/player/:action', requestAuth('api'), webRoutes.player.actions);

    //Index & generic
    router.get('/resources', requestAuth('web'), webRoutes.resources);
    router.get('/', requestAuth('web'), webRoutes.dashboard);

    //Return router
    return router;
};
