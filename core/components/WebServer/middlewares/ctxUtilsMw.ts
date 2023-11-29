const modulename = 'WebCtxUtils';
import path from 'node:path';
import fsp from 'node:fs/promises';
import ejs from 'ejs';
import xssInstancer from '@core/extras/xss.js';
import * as helpers from '@core/extras/helpers';
import { convars, txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
import getReactIndex, { tmpCustomThemes } from '../getReactIndex';
import { CtxTxVars } from './ctxVarsMw';
import DynamicAds from '../../DynamicAds';
import { Next } from 'koa';
import { CtxWithVars } from '../ctxTypes';
import consts from '@shared/consts';
import { AuthedAdminType } from '../authLogic';
const console = consoleFactory(modulename);

//Types
export type CtxTxUtils = {
    send: <T = string | object>(data: T) => void;
    utils: {
        render: (view: string, data?: { headerTitle?: string, [key: string]: any }) => Promise<void>;
        error: (httpStatus?: number, message?: string) => void;
        serveReactIndex: () => Promise<void>;
    };
}

//Helper functions
const xss = xssInstancer();
const getRenderErrorText = (view: string, error: Error, data: any) => {
    console.error(`Error rendering ${view}.`);
    console.verbose.dir(error);
    if (data?.discord?.token) data.discord.token = '[redacted]';
    return [
        '<pre style="color: red">',
        `Error rendering '${view}'.`,
        `Message: ${xss(error.message)}`,
        'The data provided was:',
        '================',
        xss(JSON.stringify(data, null, 2)),
        '</pre>',
    ].join('\n');
};
const getWebViewPath = (view: string) => {
    if (view.includes('..')) throw new Error('Path Traversal?');
    return path.join(txEnv.txAdminResourcePath, 'web', view + '.ejs');
};
const getJavascriptConsts = (allConsts: NonNullable<object> = {}) => {
    return Object.entries(allConsts)
        .map(([name, val]) => `const ${name} = ${JSON.stringify(val)};`)
        .join(' ');
};
function getEjsOptions(filePath: string) {
    const webTemplateRoot = path.resolve(txEnv.txAdminResourcePath, 'web');
    const webCacheDir = path.resolve(txEnv.txAdminResourcePath, 'web-cache', filePath);
    return {
        cache: true,
        filename: webCacheDir,
        root: webTemplateRoot,
        views: [webTemplateRoot],
        rmWhitespace: true,
        async: true,
    };
}

//Consts
const templateCache = new Map();
const RESOURCE_PATH = 'nui://monitor/web/public/';

const displayFxserverVersionPrefix = convars.isZapHosting && '/ZAP' || convars.isPterodactyl && '/Ptero' || '';
const displayFxserverVersion = `${txEnv.fxServerVersion}${displayFxserverVersionPrefix}`;


/**
 * Loads re-usable base templates
 */
async function loadWebTemplate(name: string) {
    if (convars.isDevMode || !templateCache.has(name)) {
        try {
            const rawTemplate = await fsp.readFile(getWebViewPath(name), 'utf-8');
            const compiled = ejs.compile(rawTemplate, getEjsOptions(name + '.ejs'));
            templateCache.set(name, compiled);
        } catch (error) {
            if ((error as any).code == 'ENOENT') {
                throw new Error([
                    `The '${name}' template was not found:`,
                    `You probably deleted the 'citizen/system_resources/monitor/web/${name}.ejs' file, or the folders above it.`
                ].join('\n'));
            } else {
                throw error;
            }
        }
    }

    return templateCache.get(name);
}


/**
 * Renders normal views.
 * Footer and header are configured inside the view template itself.
 */
async function renderView(
    view: string,
    possiblyAuthedAdmin: AuthedAdminType | undefined,
    data: any,
    txVars: CtxTxVars,
    dynamicAds: DynamicAds
) {
    data.adminUsername = possiblyAuthedAdmin?.name ?? 'unknown user';
    data.adminIsMaster = possiblyAuthedAdmin && possiblyAuthedAdmin.isMaster;
    data.profilePicture = possiblyAuthedAdmin?.profilePicture ?? 'img/default_avatar.png';
    data.isTempPassword = possiblyAuthedAdmin && possiblyAuthedAdmin.isTempPassword;
    data.isLinux = !txEnv.isWindows;
    data.showAdvanced = (convars.isDevMode || console.isVerbose);
    data.dynamicAd = txVars.isWebInterface && dynamicAds.pick('main');

    try {
        return await loadWebTemplate(view).then(template => template(data));
    } catch (error) {
        return getRenderErrorText(view, error as Error, data);
    }
}


/**
 * Renders the login page.
 */
async function renderLoginView(data: any, txVars: CtxTxVars, dynamicAds: DynamicAds) {
    data.logoURL = convars.loginPageLogo || 'img/txadmin.png';
    data.isMatrix = (Math.random() <= 0.05);
    data.ascii = helpers.txAdminASCII();
    data.message = data.message || '';
    data.errorTitle = data.errorTitle || 'Warning:';
    data.errorMessage = data.errorMessage || '';
    data.template = data.template || 'normal';
    data.dynamicAd = txVars.isWebInterface && dynamicAds.pick('login');

    try {
        return await loadWebTemplate('standalone/login').then(template => template(data));
    } catch (error) {
        console.dir(error);
        return getRenderErrorText('Login', error as Error, data);
    }
}


/**
 * Middleware that adds some helper functions and data to the koa ctx object
 */
export default async function ctxUtilsMw(ctx: CtxWithVars, next: Next) {
    //Shortcuts
    const isWebInterface = ctx.txVars.isWebInterface;
    const txAdmin = ctx.txAdmin;

    //Functions
    const renderUtil = async (view: string, data?: { headerTitle?: string, [key: string]: any }) => {
        //Usage stats
        txAdmin.statisticsManager?.pageViews.count(view);

        //Typescript is very annoying 
        const possiblyAuthedAdmin = ctx.admin as AuthedAdminType | undefined;

        //Setting up legacy theme
        let legacyTheme = '';
        const themeCookie = ctx.cookies.get('txAdmin-theme');
        if(!themeCookie || themeCookie === 'dark' || !isWebInterface){
            legacyTheme = 'theme--dark';
        } else {
            const selectorTheme = tmpCustomThemes.find((theme) => theme.name === themeCookie);
            if(selectorTheme?.isDark){
                legacyTheme = 'theme--dark';
            }
        }

        // Setting up default render data:
        const baseViewData = {
            isWebInterface,
            basePath: (isWebInterface) ? '/' : consts.nuiWebpipePath,
            resourcePath: (isWebInterface) ? '' : RESOURCE_PATH,
            serverProfile: txAdmin.info.serverProfile,
            serverName: txAdmin.globalConfig.serverName || txAdmin.info.serverProfile,
            uiTheme: legacyTheme,
            fxServerVersion: displayFxserverVersion,
            txAdminVersion: txEnv.txAdminVersion,
            jsInjection: getJavascriptConsts({
                isZapHosting: convars.isZapHosting, //not in use
                isPterodactyl: convars.isPterodactyl, //not in use
                isWebInterface: isWebInterface,
                csrfToken: (possiblyAuthedAdmin?.csrfToken) ? possiblyAuthedAdmin.csrfToken : 'not_set',
                TX_BASE_PATH: (isWebInterface) ? '' : consts.nuiWebpipePath,
                PAGE_TITLE: data?.headerTitle ?? 'txAdmin',
            }),
        };

        const renderData = Object.assign(baseViewData, data);
        if (view == 'login') {
            ctx.body = await renderLoginView(renderData, ctx.txVars, txAdmin.dynamicAds);
        } else {
            ctx.body = await renderView(view, possiblyAuthedAdmin, renderData, ctx.txVars, txAdmin.dynamicAds);
        }
        ctx.type = 'text/html';
    };

    const errorUtil = (httpStatus = 500, message = 'unknown error') => {
        ctx.status = httpStatus;
        ctx.body = {
            status: 'error',
            code: httpStatus,
            message,
        };
    };

    const serveReactIndex = async () => {
        //FIXME: no cache, even in prod mode
        ctx.body = await getReactIndex(ctx);
        ctx.type = 'text/html';
    };

    //Injecting utils and forwarding
    ctx.utils = {
        render: renderUtil,
        error: errorUtil,
        serveReactIndex,
    };
    ctx.send = <T = string | object>(data: T) => {
        ctx.body = data;
    };
    return next();
};
