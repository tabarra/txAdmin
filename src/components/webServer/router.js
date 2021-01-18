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
module.exports = router = (config) =>{
    const router = new Router();
    authLimiter = KoaRateLimit({
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
    });

    //Authentication
    router.get('/auth', webRoutes.auth.get);
    router.all('/auth/addMaster/:action', authLimiter, webRoutes.auth.addMaster);
    router.get('/auth/:provider/redirect', authLimiter, webRoutes.auth.providerRedirect);
    router.get('/auth/:provider/callback', authLimiter, webRoutes.auth.providerCallback);
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
    router.get('/serverLog', requestAuth('web'), webRoutes.serverLog);
    router.get('/status', requestAuth('api'), webRoutes.status);
    router.get('/chartData', requestAuth('api'), webRoutes.chartData);

    //Player routes
    router.get('/player/list', requestAuth('web'), webRoutes.player.list);
    router.get('/player/:license', requestAuth('api'), webRoutes.player.modal);
    router.post('/player/:action', requestAuth('api'), webRoutes.player.actions);

    //Index & generic
    router.get('/resources', requestAuth('web'), webRoutes.resources);
    router.get('/', requestAuth('web'), webRoutes.dashboard);

    //Return router
    return router;
};
