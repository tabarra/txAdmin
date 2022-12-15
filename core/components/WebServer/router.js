import { convars } from '@core/globalData';
import Router from '@koa/router';
import KoaRateLimit from 'koa-ratelimit';

import * as webRoutes from '../../webroutes';
import { requestAuth } from './requestAuthenticator';


/**
 * Router factory
 * @param {object} config
 */
export default (config) => {
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
                    <h1>Too many authentication attempts, enjoy your ${config.limiterMinutes} minutes of cooldown.</h1>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/otCpCn0l4Wo?start=15" frameborder="0" allow="accelerometer; autoplay="1"; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </body>
            </html>`,
        max: config.limiterAttempts,
        disableHeader: true,
        id: (ctx) => ctx.txVars.realIP,
    });
    const chartDataLimiter = KoaRateLimit({
        driver: 'memory',
        db: new Map(),
        max: 10,
        duration: 30 * 1000,
        errorMessage: JSON.stringify({ failReason: 'rate_limiter' }),
        disableHeader: true,
        id: (ctx) => ctx.txVars.realIP,
    });

    //Authentication
    router.get('/auth', webRoutes.auth_get);
    router.all('/auth/addMaster/:action', authLimiter, webRoutes.auth_addMaster);
    router.get('/auth/:provider/redirect', authLimiter, webRoutes.auth_providerRedirect);
    router.get('/auth/:provider/callback', authLimiter, webRoutes.auth_providerCallback);
    router.post('/auth/password', authLimiter, webRoutes.auth_verifyPassword);
    router.post('/changePassword', requestAuth('api'), webRoutes.auth_changePassword);

    //Admin Manager
    router.get('/adminManager', requestAuth('web'), webRoutes.adminManager_get);
    router.post('/adminManager/getModal/:modalType', requestAuth('web'), webRoutes.adminManager_getModal);
    router.post('/adminManager/:action', requestAuth('api'), webRoutes.adminManager_actions);

    //Settings
    router.get('/setup', requestAuth('web'), webRoutes.setup_get);
    router.post('/setup/:action', requestAuth('api'), webRoutes.setup_post);
    router.get('/deployer', requestAuth('web'), webRoutes.deployer_stepper);
    router.get('/deployer/status', requestAuth('api'), webRoutes.deployer_status);
    router.post('/deployer/recipe/:action', requestAuth('api'), webRoutes.deployer_actions);
    router.get('/settings', requestAuth('web'), webRoutes.settings_get);
    router.post('/settings/save/:scope', requestAuth('api'), webRoutes.settings_save);

    //Master Actions
    router.get('/masterActions', requestAuth('web'), webRoutes.masterActions_page);
    router.get('/masterActions/backupDatabase', requestAuth('web'), webRoutes.masterActions_getBackup);
    router.post('/masterActions/:action', requestAuth('api'), webRoutes.masterActions_actions);

    //FXServer
    router.post('/fxserver/controls', requestAuth('api'), webRoutes.fxserver_controls);
    router.post('/fxserver/commands', requestAuth('api'), webRoutes.fxserver_commands);
    router.get('/fxserver/downloadLog', requestAuth('web'), webRoutes.fxserver_downloadLog);
    router.post('/fxserver/schedule', requestAuth('api'), webRoutes.fxserver_schedule);

    //CFG Editor
    router.get('/cfgEditor', requestAuth('web'), webRoutes.cfgEditor_get);
    router.post('/cfgEditor/save', requestAuth('api'), webRoutes.cfgEditor_save);

    //Control routes
    router.get('/console', requestAuth('web'), webRoutes.liveConsole);
    router.post('/intercom/:scope', requestAuth('intercom'), webRoutes.intercom);

    //Diagnostic routes
    router.get('/diagnostics', requestAuth('web'), webRoutes.diagnostics_page);
    router.post('/diagnostics/sendReport', requestAuth('web'), webRoutes.diagnostics_sendReport);
    router.get('/advanced', requestAuth('web'), webRoutes.advanced_get);
    router.post('/advanced', requestAuth('api'), webRoutes.advanced_actions);

    //Data routes
    router.get('/systemLog', requestAuth('web'), webRoutes.systemLog);
    router.get('/serverLog', requestAuth('web'), webRoutes.serverLog);
    router.get('/serverLog/partial', requestAuth('api'), webRoutes.serverLogPartial);
    router.get('/status/:scope?', requestAuth('api'), webRoutes.status);
    router.get('/chartData/:thread?', chartDataLimiter, webRoutes.chartData);
    router.post('/database/:action', requestAuth('api'), webRoutes.databaseActions);

    /*
        FIXME: reorganizar TODAS rotas de logs, incluindo listagem e download
        /logs/:logpage - WEB
        /logs/:log/list - API
        /logs/:log/partial - API
        /logs/:log/download - WEB
    */

    //Player routes
    router.get('/player', requestAuth('api'), webRoutes.player_modal);
    router.get('/player/list', requestAuth('web'), webRoutes.player_list);
    router.get('/player/search', requestAuth('api'), webRoutes.player_search);
    router.post('/player/checkJoin', requestAuth('intercom'), webRoutes.player_checkJoin);
    router.post('/player/:action', requestAuth('api'), webRoutes.player_actions);
    router.get('/whitelist', requestAuth('web'), webRoutes.whitelist_page);
    router.get('/whitelist/:table', requestAuth('api'), webRoutes.whitelist_list);
    router.post('/whitelist/:table/:action', requestAuth('api'), webRoutes.whitelist_actions);

    //Index & generic
    router.get('/resources', requestAuth('web'), webRoutes.resources);
    router.get('/', requestAuth('web'), webRoutes.dashboard);

    //NUI specific routes
    router.get('/nui/auth', requestAuth('nui'), webRoutes.auth_nui);
    router.get('/nui/player', requestAuth('nui'), webRoutes.player_modal);
    router.post('/nui/player/:action', requestAuth('nui'), webRoutes.player_actions);
    router.post('/nui/database/:action', requestAuth('nui'), webRoutes.databaseActions);
    router.get('/nui/start/:route?', requestAuth('nuiStart'), async (ctx, next) => {
        if (ctx.params.route === 'adminManager') {
            return await webRoutes.adminManager_get(ctx, next);
        } else {
            return await webRoutes.serverLog(ctx, next);
        }
    });

    //DevDebug routes - no auth
    if (convars.isDevMode) {
        router.get('/dev/:scope', webRoutes.dev_get);
        router.post('/dev/:scope', webRoutes.dev_post);
    };

    //Return router
    return router;
};
