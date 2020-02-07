//Requires
const Router = require('@koa/router');
const KoaRateLimit = require('koa-ratelimit');

const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webRoutes = require('../../webroutes');
const {requestAuth} = require('./requestAuthenticator');
const context = 'WebServer:Router';

//Helper function
function handleRouteError(res, req, route, error){
    try {
        //Ignoring (mostly) timeouts
        if(error.code == 'ERR_HTTP_HEADERS_SENT') return;

        let desc = `Internal Error on: ${req.originalUrl}`;
        logError(desc, `${context}:${route}`);
        if(globals.config.verbose) dir(error)
        res.status(500).send(`[${route} Route Internal Error]`);
    } catch (error) {}
}


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
        errorMessage: `Too many attempts, enjoy your ${config.limiterMinutes} minutes of cooldown.`,
        max: config.limiterAttempts,
        disableHeader: true,
    });


    //FIXME: test only
    router.get('/', async (ctx) => {
        return ctx.utils.render('login', {message: 'sdfsdfdfs'})
    });

/*
    //Authentication
    router.get('/auth', async (req, res) => {
        await webRoutes.auth.get(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-Get', err);
        });
    });
    router.all('/auth/addMaster/:action', authLimiter, async (req, res) => {
        await webRoutes.auth.addMaster(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-AddMaster', err);
        });
    });

    router.get('/auth/:provider/redirect', authLimiter, async (req, res) => {
        await webRoutes.auth.providerRedirect(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-ProviderRedirect', err);
        });
    });
    router.get('/auth/:provider/callback', authLimiter, async (req, res) => {
        await webRoutes.auth.providerCallback(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-ProviderCallback', err);
        });
    });
    router.post('/auth/password', authLimiter, async (req, res) => {
        await webRoutes.auth.verifyPassword(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-VerifyPassword', err);
        });
    });
    router.post('/changePassword', requestAuth('web'), async (req, res) => {
        await webRoutes.auth.changePassword(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-ChangePassword', err);
        });
    });

    //Admin Manager
    router.get('/adminManager', requestAuth('web'), async (req, res) => {
        await webRoutes.adminManager.get(res, req).catch((err) => {
            handleRouteError(res, req, 'AdminManager-Get', err);
        });
    });
    router.post('/adminManager/:action', requestAuth('web'), async (req, res) => {
        await webRoutes.adminManager.actions(res, req).catch((err) => {
            handleRouteError(res, req, 'AdminManager-Actions', err);
        });
    });

    //Settings
    router.get('/settings', requestAuth('web'), async (req, res) => {
        await webRoutes.settings.get(res, req).catch((err) => {
            handleRouteError(res, req, 'Settings-Get', err);
        });
    });
    router.post('/settings/save/:scope', requestAuth('web'), async (req, res) => {
        await webRoutes.settings.save(res, req).catch((err) => {
            handleRouteError(res, req, 'Settings-Save', err);
        });
    });

    //FXServer
    router.get('/fxserver/controls/:action', requestAuth('api'), async (req, res) => {
        await webRoutes.fxserver.controls(res, req).catch((err) => {
            handleRouteError(res, req, 'FXServer-Controls', err);
        });
    });
    router.post('/fxserver/commands', requestAuth('web'), async (req, res) => {
        await webRoutes.fxserver.commands(res, req).catch((err) => {
            handleRouteError(res, req, 'FXServer-Commands', err);
        });
    });

    //CFG Editor
    router.get('/cfgEditor', requestAuth('web'), async (req, res) => {
        await webRoutes.cfgEditor.get(res, req).catch((err) => {
            handleRouteError(res, req, 'CFGEditor-Get', err);
        });
    });
    router.post('/cfgEditor/save', requestAuth('api'), async (req, res) => {
        await webRoutes.cfgEditor.save(res, req).catch((err) => {
            handleRouteError(res, req, 'CFGEditor-Save', err);
        });
    });

    //Experiments
    router.get('/experiments/bans', requestAuth('web'), async (req, res) => {
        await webRoutes.experiments.bans.get(res, req).catch((err) => {
            handleRouteError(res, req, 'Experiments-Bans-Get', err);
        });
    });
    router.all('/experiments/bans/actions/:action', requestAuth('web'), async (req, res) => {
        await webRoutes.experiments.bans.actions(res, req).catch((err) => {
            handleRouteError(res, req, 'Experiments-Bans-Actions', err);
        });
    });


    //Control routes
    router.get('/console', requestAuth('web'), async (req, res) => {
        await webRoutes.liveConsole(res, req).catch((err) => {
            handleRouteError(res, req, 'liveConsole', err);
        });
    });
    router.post('/intercom/:scope', requestAuth('intercom'), async (req, res) => {
        await webRoutes.intercom(res, req).catch((err) => {
            handleRouteError(res, req, 'intercom', err);
        });
    });

    //Diagnostic routes
    router.get('/diagnostics', requestAuth('web'), async (req, res) => {
        await webRoutes.diagnostics.get(res, req).catch((err) => {
            handleRouteError(res, req, 'diagnostics', err);
        });
    });
    router.get('/diagnostics/log', requestAuth('web'), async (req, res) => {
        await webRoutes.diagnostics.getLog(res, req).catch((err) => {
            handleRouteError(res, req, 'diagnostics-log', err);
        });
    });

    //Data routes
    router.get('/actionLog', requestAuth('web'), async (req, res) => {
        await webRoutes.actionLog(res, req).catch((err) => {
            handleRouteError(res, req, 'actionLog', err);
        });
    });
    router.get('/serverLog', requestAuth('web'), async (req, res) => {
        await webRoutes.serverLog(res, req).catch((err) => {
            handleRouteError(res, req, 'serverLog', err);
        });
    });
    router.get('/status', requestAuth('api'), async (req, res) => {
        await webRoutes.status(res, req).catch((err) => {
            handleRouteError(res, req, 'status', err);
        });
    });
    router.get('/getPlayerData/:id', requestAuth('api'), async (req, res) => {
        await webRoutes.getPlayerData(res, req).catch((err) => {
            handleRouteError(res, req, 'getPlayerData', err);
        });
    });
    router.get('/downFXServerLog', requestAuth('web'), async (req, res) => {
        await webRoutes.downFXServerLog(res, req).catch((err) => {
            handleRouteError(res, req, 'downFXServerLog', err);
        });
    });

    //Index & generic
    router.get('/', requestAuth('web'), async (req, res) => {
        await webRoutes.dashboard(res, req).catch((err) => {
            handleRouteError(res, req, 'dashboard', err);
        });
    });
    router.get('/resources', requestAuth('web'), async (req, res) => {
        await webRoutes.resources(res, req).catch((err) => {
            handleRouteError(res, req, 'resources', err);
        });
    });
    router.get('/addExtension', requestAuth('web'), async (req, res) => {
        await webRoutes.addExtension(res, req).catch((err) => {
            handleRouteError(res, req, 'addExtension', err);
        });
    });
    */

    //Return router
    return router;
};
