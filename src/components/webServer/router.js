//Requires
const express = require('express');
const rateLimit = require("express-rate-limit");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('../../webroutes/webUtils');
const webRoutes = require('../../webroutes');
const requestAuth = require('./requestAuthenticator');
const context = 'WebServer:Router';

//Helper function
function handleRouteError(res, req, route, error){
    try {
        let desc = `Internal Error on: ${req.originalUrl}`;
        logError(desc, `${context}:${route}`);
        res.status(500).send(`[${route} Route Internal Error]`);
    } catch (error) {}
}


/**
 * Router factory
 * @param {object} config
 */
module.exports = router = (config) =>{
    const router = express.Router();
    authLimiter = rateLimit({
        windowMs: config.limiterMinutes * 60 * 1000, // 15 minutes
        max: config.limiterAttempts, // limit each IP to 5 requests per 15 minutes
        message: `Too many login attempts, enjoy your ${config.limiterMinutes} minutes of cooldown.`
    });


    //Authentication
    router.get('/auth', async (req, res) => {
        await webRoutes.auth.get(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-Get', err);
        });
    });
    router.post('/auth', authLimiter, async (req, res) => {
        await webRoutes.auth.verify(res, req).catch((err) => {
            handleRouteError(res, req, 'Auth-Verify', err);
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

    //Control routes
    router.get('/fxControls/:action', requestAuth('api'), async (req, res) => {
        await webRoutes.fxControls(res, req).catch((err) => {
            handleRouteError(res, req, 'fxControls', err);
        });
    });
    router.post('/fxCommands', requestAuth('web'), async (req, res) => {
        await webRoutes.fxCommands(res, req).catch((err) => {
            handleRouteError(res, req, 'fxCommands', err);
        });
    });
    router.get('/console', requestAuth('web'), async (req, res) => {
        await webRoutes.getConsole(res, req).catch((err) => {
            handleRouteError(res, req, 'getConsole', err);
        });
    });
    router.post('/saveSettings/:scope', requestAuth('web'), async (req, res) => {
        await webRoutes.saveSettings(res, req).catch((err) => {
            handleRouteError(res, req, 'saveSettings', err);
        });
    });
    router.post('/intercom/:scope', requestAuth('intercom'), async (req, res) => {
        await webRoutes.intercom(res, req).catch((err) => {
            handleRouteError(res, req, 'intercom', err);
        });
    });

    //Data routes
    router.get('/actionLog', requestAuth('web'), async (req, res) => {
        await webRoutes.getActionLog(res, req).catch((err) => {
            handleRouteError(res, req, 'getActionLog', err);
        });
    });
    router.get('/serverLog', requestAuth('web'), async (req, res) => {
        await webRoutes.getServerLog(res, req).catch((err) => {
            handleRouteError(res, req, 'getServerLog', err);
        });
    });
    router.get('/fullReport', requestAuth('web'), async (req, res) => {
        await webRoutes.getFullReport(res, req).catch((err) => {
            handleRouteError(res, req, 'getFullReport', err);
        });
    });

    router.get('/getStatus', requestAuth('api'), async (req, res) => {
        await webRoutes.getStatus(res, req).catch((err) => {
            handleRouteError(res, req, 'getStatus', err);
        });
    });

    router.get('/getPlayerData/:id', requestAuth('api'), async (req, res) => {
        await webRoutes.getPlayerData(res, req).catch((err) => {
            handleRouteError(res, req, 'getPlayerData', err);
        });
    });
    router.get('/downloadLog', requestAuth('web'), async (req, res) => {
        await webRoutes.downloadLog(res, req).catch((err) => {
            handleRouteError(res, req, 'downloadLog', err);
        });
    });

    //Index & generic
    router.get('/', requestAuth('web'), async (req, res) => {
        await webRoutes.getDashboard(res, req).catch((err) => {
            handleRouteError(res, req, 'getDashboard', err);
        });
    });
    router.get('/settings', requestAuth('web'), async (req, res) => {
        await webRoutes.getSettings(res, req).catch((err) => {
            handleRouteError(res, req, 'getSettings', err);
        });
    });
    router.get('/resources', requestAuth('web'), async (req, res) => {
        await webRoutes.getResources(res, req).catch((err) => {
            handleRouteError(res, req, 'getResources', err);
        });
    });
    router.get('/addExtension', requestAuth('web'), async (req, res) => {
        await webRoutes.getAddExtension(res, req).catch((err) => {
            handleRouteError(res, req, 'getAddExtension', err);
        });
    });

    //Return router
    return router;
};
