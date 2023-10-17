import { convars } from '@core/globalData';
import Router from '@koa/router';
import KoaRateLimit from 'koa-ratelimit';

import * as webRoutes from '../../webroutes';
import { apiAuthMw, intercomAuthMw, legacyWebAuthMw } from './middlewares/authMws';
import { WebServerConfigType } from '.';


/**
 * Router factory
 * @param {object} config
 */
export default (config: WebServerConfigType) => {
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
        id: (ctx: any) => ctx.txVars.realIP,
    });
    const chartDataLimiter = KoaRateLimit({
        driver: 'memory',
        db: new Map(),
        max: 10,
        duration: 30 * 1000,
        errorMessage: JSON.stringify({ failReason: 'rate_limiter' }),
        disableHeader: true,
        id: (ctx: any) => ctx.txVars.realIP,
    });

    //Rendered Pages
    router.get('/legacy/adminManager', legacyWebAuthMw, webRoutes.adminManager_page);
    router.get('/legacy/advanced', legacyWebAuthMw, webRoutes.advanced_page);
    router.get('/legacy/cfgEditor', legacyWebAuthMw, webRoutes.cfgEditor_page);
    router.get('/legacy/console', legacyWebAuthMw, webRoutes.liveConsole);
    router.get('/legacy/dashboard', legacyWebAuthMw, webRoutes.dashboard);
    router.get('/legacy/diagnostics', legacyWebAuthMw, webRoutes.diagnostics_page);
    router.get('/legacy/masterActions', legacyWebAuthMw, webRoutes.masterActions_page);
    router.get('/legacy/players', legacyWebAuthMw, webRoutes.player_page);
    router.get('/legacy/resources', legacyWebAuthMw, webRoutes.resources);
    router.get('/legacy/serverLog', legacyWebAuthMw, webRoutes.serverLog);
    router.get('/legacy/settings', legacyWebAuthMw, webRoutes.settings_page);
    router.get('/legacy/systemLog', legacyWebAuthMw, webRoutes.systemLog);
    router.get('/legacy/whitelist', legacyWebAuthMw, webRoutes.whitelist_page);
    //FIXME: deal with these
    router.get('/setup', legacyWebAuthMw, webRoutes.setup_get);
    router.get('/deployer', legacyWebAuthMw, webRoutes.deployer_stepper);

    //Authentication
    router.get('/auth/self', apiAuthMw, webRoutes.auth_self);
    router.get('/auth', webRoutes.auth_get); //FIXME: legacy page
    router.all('/auth/addMaster/:action', authLimiter, webRoutes.auth_addMaster);
    router.get('/auth/:provider/redirect', authLimiter, webRoutes.auth_providerRedirect);
    router.get('/auth/:provider/callback', authLimiter, webRoutes.auth_providerCallback);
    router.post('/auth/password', authLimiter, webRoutes.auth_verifyPassword);
    router.post('/changePassword', apiAuthMw, webRoutes.auth_changePassword);

    //Admin Manager
    router.post('/adminManager/getModal/:modalType', legacyWebAuthMw, webRoutes.adminManager_getModal);
    router.post('/adminManager/:action', apiAuthMw, webRoutes.adminManager_actions);

    //Settings
    router.post('/setup/:action', apiAuthMw, webRoutes.setup_post);
    router.get('/deployer/status', apiAuthMw, webRoutes.deployer_status);
    router.post('/deployer/recipe/:action', apiAuthMw, webRoutes.deployer_actions);
    router.post('/settings/save/:scope', apiAuthMw, webRoutes.settings_save);

    //Master Actions
    router.get('/masterActions/backupDatabase', legacyWebAuthMw, webRoutes.masterActions_getBackup);
    router.post('/masterActions/:action', apiAuthMw, webRoutes.masterActions_actions);

    //FXServer
    router.post('/fxserver/controls', apiAuthMw, webRoutes.fxserver_controls);
    router.post('/fxserver/commands', apiAuthMw, webRoutes.fxserver_commands);
    router.get('/fxserver/downloadLog', legacyWebAuthMw, webRoutes.fxserver_downloadLog);
    router.post('/fxserver/schedule', apiAuthMw, webRoutes.fxserver_schedule);

    //CFG Editor
    router.post('/cfgEditor/save', apiAuthMw, webRoutes.cfgEditor_save);

    //Control routes
    router.post('/intercom/:scope', intercomAuthMw, webRoutes.intercom);

    //Diagnostic routes
    router.post('/diagnostics/sendReport', apiAuthMw, webRoutes.diagnostics_sendReport);
    router.post('/advanced', apiAuthMw, webRoutes.advanced_actions);

    //Data routes
    router.get('/serverLog/partial', apiAuthMw, webRoutes.serverLogPartial);
    router.get('/chartData/:thread?', chartDataLimiter, webRoutes.chartData);
    router.post('/database/:action', apiAuthMw, webRoutes.databaseActions);

    /*
        FIXME: reorganizar TODAS rotas de logs, incluindo listagem e download
        /logs/:logpage - WEB
        /logs/:log/list - API
        /logs/:log/partial - API
        /logs/:log/download - WEB
    */

    //Player routes
    router.get('/player', apiAuthMw, webRoutes.player_modal);
    router.get('/player/search', apiAuthMw, webRoutes.player_search);
    router.post('/player/checkJoin', intercomAuthMw, webRoutes.player_checkJoin);
    router.post('/player/:action', apiAuthMw, webRoutes.player_actions);
    router.get('/whitelist/:table', apiAuthMw, webRoutes.whitelist_list);
    router.post('/whitelist/:table/:action', apiAuthMw, webRoutes.whitelist_actions);

    //FIXME: migrate
    // router.get('/nui/start/:route?', requestAuth('nuiStart'), async (ctx: InitializedCtx, next: Function) => {
    //     return ctx.utils.serveReactIndex();
    // });

    //DevDebug routes - no auth
    if (convars.isDevMode) {
        router.get('/dev/:scope', webRoutes.dev_get);
        router.post('/dev/:scope', webRoutes.dev_post);
    };

    //Insights page mock
    // router.get('/insights', (ctx) => {
    //     return ctx.utils.render('main/insights', { headerTitle: 'Insights' });
    // });

    //Return router
    return router;
};
