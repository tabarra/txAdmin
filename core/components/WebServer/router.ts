import { convars } from '@core/globalData';
import Router from '@koa/router';
import KoaRateLimit from 'koa-ratelimit';

import * as webRoutes from '../../webroutes';
import { apiAuthMw, intercomAuthMw, webAuthMw } from './middlewares/authMws';
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
        errorMessage: JSON.stringify({
            //Duplicated to maintain compatibility with all auth api routes
            error: `Too many attempts. Blocked for ${config.limiterMinutes} minutes.`,
            errorTitle: 'Too many attempts.',
            errorMessage: `Blocked for ${config.limiterMinutes} minutes.`,
        }),
        max: config.limiterAttempts,
        disableHeader: true,
        id: (ctx: any) => ctx.txVars.realIP,
    });

    //Rendered Pages
    router.get('/legacy/adminManager', webAuthMw, webRoutes.adminManager_page);
    router.get('/legacy/advanced', webAuthMw, webRoutes.advanced_page);
    router.get('/legacy/cfgEditor', webAuthMw, webRoutes.cfgEditor_page);
    router.get('/legacy/dashboard', webAuthMw, webRoutes.dashboard);
    router.get('/legacy/diagnostics', webAuthMw, webRoutes.diagnostics_page);
    router.get('/legacy/masterActions', webAuthMw, webRoutes.masterActions_page);
    router.get('/legacy/resources', webAuthMw, webRoutes.resources);
    router.get('/legacy/serverLog', webAuthMw, webRoutes.serverLog);
    router.get('/legacy/settings', webAuthMw, webRoutes.settings_page);
    router.get('/legacy/whitelist', webAuthMw, webRoutes.whitelist_page);
    router.get('/legacy/setup', webAuthMw, webRoutes.setup_get);
    router.get('/legacy/deployer', webAuthMw, webRoutes.deployer_stepper);

    //Authentication
    router.get('/auth/self', apiAuthMw, webRoutes.auth_self);
    router.post('/auth/password', authLimiter, webRoutes.auth_verifyPassword);
    router.post('/auth/logout', authLimiter, webRoutes.auth_logout);
    router.post('/auth/addMaster/pin', authLimiter, webRoutes.auth_addMasterPin);
    router.post('/auth/addMaster/callback', authLimiter, webRoutes.auth_addMasterCallback);
    router.post('/auth/addMaster/save', authLimiter, webRoutes.auth_addMasterSave);
    router.get('/auth/cfxre/redirect', authLimiter, webRoutes.auth_providerRedirect);
    router.post('/auth/cfxre/callback', authLimiter, webRoutes.auth_providerCallback);
    router.post('/auth/changePassword', apiAuthMw, webRoutes.auth_changePassword);
    router.get('/auth/getIdentifiers', apiAuthMw, webRoutes.auth_getIdentifiers);
    router.post('/auth/changeIdentifiers', apiAuthMw, webRoutes.auth_changeIdentifiers);

    //Admin Manager
    router.post('/adminManager/getModal/:modalType', webAuthMw, webRoutes.adminManager_getModal);
    router.post('/adminManager/:action', apiAuthMw, webRoutes.adminManager_actions);

    //Settings
    router.post('/setup/:action', apiAuthMw, webRoutes.setup_post);
    router.get('/deployer/status', apiAuthMw, webRoutes.deployer_status);
    router.post('/deployer/recipe/:action', apiAuthMw, webRoutes.deployer_actions);
    router.post('/settings/save/:scope', apiAuthMw, webRoutes.settings_save);
    router.get('/settings/banTemplates', apiAuthMw, webRoutes.settings_getBanTemplates);
    router.post('/settings/banTemplates', apiAuthMw, webRoutes.settings_saveBanTemplates);

    //Master Actions
    router.get('/masterActions/backupDatabase', webAuthMw, webRoutes.masterActions_getBackup);
    router.post('/masterActions/:action', apiAuthMw, webRoutes.masterActions_actions);

    //FXServer
    router.post('/fxserver/controls', apiAuthMw, webRoutes.fxserver_controls);
    router.post('/fxserver/commands', apiAuthMw, webRoutes.fxserver_commands);
    router.get('/fxserver/downloadLog', webAuthMw, webRoutes.fxserver_downloadLog);
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
    router.get('/systemLog/:scope', apiAuthMw, webRoutes.systemLogs);
    router.get('/perfChartData/:thread', apiAuthMw, webRoutes.perfChart);
    router.get('/playerCrashesData', apiAuthMw, webRoutes.playerCrashes);

    /*
        FIXME: reorganizar TODAS rotas de logs, incluindo listagem e download
        /logs/:logpage - WEB
        /logs/:log/list - API
        /logs/:log/partial - API
        /logs/:log/download - WEB
    */

    //History routes
    router.get('/history/stats', apiAuthMw, webRoutes.history_stats);
    router.get('/history/search', apiAuthMw, webRoutes.history_search);
    router.get('/history/action', apiAuthMw, webRoutes.history_actionModal);
    router.post('/history/:action', apiAuthMw, webRoutes.history_actions);

    //Player routes
    router.get('/player', apiAuthMw, webRoutes.player_modal);
    router.get('/player/stats', apiAuthMw, webRoutes.player_stats);
    router.get('/player/search', apiAuthMw, webRoutes.player_search);
    router.post('/player/checkJoin', intercomAuthMw, webRoutes.player_checkJoin);
    router.post('/player/:action', apiAuthMw, webRoutes.player_actions);
    router.get('/whitelist/:table', apiAuthMw, webRoutes.whitelist_list);
    router.post('/whitelist/:table/:action', apiAuthMw, webRoutes.whitelist_actions);

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
