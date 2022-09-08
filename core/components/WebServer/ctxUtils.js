const modulename = 'WebCtxUtils';
import path from 'path';
import fse from 'fs-extra';
import ejs from 'ejs';
import chalk from 'chalk';
import * as helpers from '@core/extras/helpers.js';
import consts from '@core/extras/consts.js';
import logger from '@core/extras/console.js';
import { convars, txEnv, verbose } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const getRenderErrorText = (view, error, data) => {
    logError(`Error rendering ${view}.`);
    if (verbose) dir(error);
    if (!isUndefined(data.discord) && !isUndefined(data.discord.token)) data.discord.token = '[redacted]';
    let out = '<pre>\n';
    out += `Error rendering '${view}'.\n`;
    out += `Message: ${error.message}\n`;
    out += 'The data provided was:\n';
    out += '================\n';
    out += JSON.stringify(data, null, 2);
    out += '</pre>\n';
    return out;
};
const getWebViewPath = (view) => {
    if (view.includes('..')) throw new Error('Path Traversal?');
    return path.join(txEnv.txAdminResourcePath, 'web', view + '.ejs');
};
const getJavascriptConsts = (allConsts = []) => {
    return Object.entries(allConsts)
        .map(([name, val]) => `const ${name} = ${JSON.stringify(val)};`)
        .join(' ');
};

//Consts
const templateCache = new Map();
const WEBPIPE_PATH = 'https://monitor/WebPipe/';
const RESOURCE_PATH = 'nui://monitor/web/public/';
const THEME_DARK = 'theme--dark';
const DEFAULT_AVATAR = 'img/default_avatar.png';

function getEjsOptions(filePath) {
    const webTemplateRoot = path.resolve(txEnv.txAdminResourcePath, 'web')
    const webCacheDir = path.resolve(txEnv.txAdminResourcePath, 'web-cache', filePath)
    return {
        cache: true,
        filename: webCacheDir,
        root: webTemplateRoot,
        views: [webTemplateRoot],
        rmWhitespace: true,
        async: true,
    }
}

//================================================================

/**
 * Loads re-usable base templates
 * @param {String} name
 * @returns {Promise<void>}
 */
async function loadWebTemplate(name) {
    if (convars.isDevMode || !templateCache.has(name)) {
        try {
            const rawTemplate = await fse.readFile(getWebViewPath(name), 'utf-8');
            const compiled = ejs.compile(rawTemplate, getEjsOptions(name + '.ejs'));
            templateCache.set(name, compiled);
        } catch (e) {
            if (e.code == 'ENOENT') {
                e = new Error(`The '${name}' template was not found:\n` +
                    `You probably deleted the 'citizen/system_resources/monitor/web/${name}.ejs' file, or the folders above it.`, undefined, e)
            }
            logError(e)
        }
    }

    return templateCache.get(name);
}


//================================================================
/**
 * Renders normal views.
 * Footer and header are configured inside the view template itself.
 * @param {string} view
 * @param {string} data
 */
async function renderView(view, reqSess, data, txVars) {
    data.adminIsMaster = (reqSess && reqSess.auth && reqSess.auth.username && reqSess.auth.master === true);
    data.adminUsername = (reqSess && reqSess.auth && reqSess.auth.username) ? reqSess.auth.username : 'unknown user';
    data.profilePicture = (reqSess && reqSess.auth && reqSess.auth.picture) ? reqSess.auth.picture : DEFAULT_AVATAR;
    data.isTempPassword = (reqSess && reqSess.auth && reqSess.auth.isTempPassword);
    data.isLinux = !txEnv.isWindows;
    data.showAdvanced = (convars.isDevMode || verbose);
    data.dynamicAd = txVars.isWebInterface && globals.dynamicAds.pick('main');

    let out;
    try {
        out = await loadWebTemplate(view).then(template => template(data))
    } catch (error) {
        out = getRenderErrorText(view, error, data);
    }

    return out;
}


//================================================================
/**
 * Renders the login page.
 * @param {string} message
 */
async function renderLoginView(data, txVars) {
    data.logoURL = convars.loginPageLogo || 'img/txadmin.png';
    data.isMatrix = (Math.random() <= 0.05);
    data.ascii = helpers.txAdminASCII();
    data.message = data.message || '';
    data.errorTitle = data.errorTitle || 'Warning:';
    data.errorMessage = data.errorMessage || '';
    data.template = data.template || 'normal';
    data.dynamicAd = txVars.isWebInterface && globals.dynamicAds.pick('login');

    let out;
    try {
        out = await loadWebTemplate('standalone/login').then(template => template(data))
    } catch (error) {
        logError(error)
        out = getRenderErrorText('Login', error, data);
    }

    return out;
}


//================================================================
/**
 * Logs a command to the console and the action logger
 * @param {object} ctx
 * @param {string} data
 */
function logCommand(ctx, data) {
    log(`${ctx.session.auth.username} executing: ` + chalk.inverse(' ' + data + ' '));
    globals.logger.admin.write(`[${ctx.session.auth.username}] ${data}`);
}


//================================================================
/**
 * Logs an action to the console and the action logger
 * @param {object} ctx
 * @param {string} data
 */
function logAction(ctx, data) {
    const sess = ctx.nuiSession ?? ctx.session;
    log(`[${sess.auth.username}] ${data}`);
    globals.logger.admin.write(`[${sess.auth.username}] ${data}`);
}


//================================================================
/**
 * Check for a permission
 * @param {object} ctx
 * @param {string} perm
 * @param {string} fromCtx
 * @param {boolean} printWarn
 */
function checkPermission(ctx, perm, fromCtx, printWarn = true) {
    try {
        const sess = ctx.nuiSession ?? ctx.session;

        //For master permission
        if (perm === 'master' && sess.auth.master !== true) {
            if (verbose && printWarn) logWarn(`[${sess.auth.username}] Permission '${perm}' denied.`, fromCtx);
            return false;
        }

        //For all other permissions
        if (
            sess.auth.master === true
            || sess.auth.permissions.includes('all_permissions')
            || sess.auth.permissions.includes(perm)
        ) {
            return true;
        } else {
            if (verbose && printWarn) logWarn(`[${sess.auth.username}] Permission '${perm}' denied.`, fromCtx);
            return false;
        }
    } catch (error) {
        if (verbose && typeof fromCtx === 'string') logWarn(`Error validating permission '${perm}' denied.`, fromCtx);
        return false;
    }
}

//================================================================
//================================================================
//================================================================
export default async function WebCtxUtils(ctx, next) {
    //Prepare variables
    const isWebInterface = (typeof ctx.headers['x-txadmin-token'] !== 'string');
    ctx.txVars = {
        isWebInterface,
        realIP: ctx.ip,
    };

    //Setting up the user's host type
    const host = ctx.request.host || 'none';
    if (host.startsWith('127.0.0.1') || host.startsWith('localhost')) {
        ctx.txVars.hostType = 'localhost';
    } else if (host.includes('users.cfx.re')) {
        ctx.txVars.hostType = 'cfxre';
    } else if (/^\d+[\d.:]+\d+$/.test(host)) {
        ctx.txVars.hostType = 'ip';
    } else {
        ctx.txVars.hostType = 'other';
    }

    //Setting up the user's real ip from the webpipe
    //NOTE: not used anywhere except rate limiter, and
    // should be kept this way. When auth changes, delete this shit;
    if (
        typeof ctx.headers['x-txadmin-identifiers'] === 'string'
        && typeof ctx.headers['x-txadmin-token'] === 'string'
        && ctx.headers['x-txadmin-token'] === globals.webServer.luaComToken
        && convars.loopbackInterfaces.includes(ctx.ip)
    ) {
        const ipIdentifier = ctx.headers['x-txadmin-identifiers']
            .split(', ')
            .find((i) => i.startsWith('ip:'));
        if (typeof ipIdentifier === 'string') {
            const srcIP = ipIdentifier.substr(3);
            if (consts.regexValidIP.test(srcIP)) {
                ctx.txVars.realIP = srcIP;
            }
        }
    }

    //Functions
    ctx.send = (data) => { ctx.body = data; };
    ctx.utils = {};
    ctx.utils.render = async (view, data) => {
        //Usage stats
        if (!globals.databus.txStatsData.pageViews[view]) {
            globals.databus.txStatsData.pageViews[view] = 1;
        } else {
            globals.databus.txStatsData.pageViews[view]++;
        }

        // Setting up default render data:
        const baseViewData = {
            isWebInterface: isWebInterface,
            basePath: (isWebInterface) ? '/' : WEBPIPE_PATH,
            resourcePath: (isWebInterface) ? '' : RESOURCE_PATH,
            serverProfile: globals.info.serverProfile,
            serverName: globals.config.serverName || globals.info.serverProfile,
            uiTheme: (ctx.cookies.get('txAdmin-darkMode') === 'true' || !isWebInterface) ? THEME_DARK : '',
            fxServerVersion: (convars.isZapHosting) ? `${txEnv.fxServerVersion}/ZAP` : txEnv.fxServerVersion,
            txAdminVersion: txEnv.txAdminVersion,
            txaOutdated: globals.databus.updateChecker?.txadmin,
            fxsOutdated: globals.databus.updateChecker?.fxserver,
            jsInjection: getJavascriptConsts({
                isWebInterface: isWebInterface,
                TX_BASE_PATH: (isWebInterface) ? '' : WEBPIPE_PATH,
                PAGE_TITLE: data?.headerTitle ?? 'txAdmin',
            }),
        };

        const renderData = Object.assign(baseViewData, data);
        if (view == 'login') {
            ctx.body = await renderLoginView(renderData, ctx.txVars);
        } else {
            ctx.body = await renderView(view, ctx.session, renderData, ctx.txVars);
        }
        ctx.type = 'text/html';
    };
    ctx.utils.error = (httpStatus = 500, message = 'unknown error') => {
        ctx.status = httpStatus;
        ctx.body = {
            status: 'error',
            code: parseInt(httpStatus),
            message,
        };
    };

    ctx.utils.logAction = async (data) => {
        return logAction(ctx, data);
    };
    ctx.utils.logCommand = async (data) => {
        return logCommand(ctx, data);
    };
    ctx.utils.checkPermission = (perm, fromCtx, printWarn) => {
        return checkPermission(ctx, perm, fromCtx, printWarn);
    };

    return next();
};
