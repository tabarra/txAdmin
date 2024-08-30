const modulename = 'WebCtxUtils';
import path from 'node:path';
import fsp from 'node:fs/promises';
import ejs from 'ejs';
import xssInstancer from '@core/extras/xss.js';
import { convars, txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
import getReactIndex, { tmpCustomThemes } from '../getReactIndex';
import { CtxTxVars } from './ctxVarsMw';
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
        legacyNavigateToPage: (href: string) => void;
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

const legacyNavigateHtmlTemplate = `<style>
body {
    margin: 0;
}
.notice {
    font-family: sans-serif;
    font-size: 1.5em;
    text-align: center;
    background-color: #222326;
    color: #F7F7F8;
    padding: 2em;
    border: 1px solid #333539;
    border-radius: 0.5em;
}
.notice a {
    color: #F00A53;
}
</style>
    <p class="notice">
        Redirecting to <a href="{{href}}" target="_parent">{{href}}</a>...
    </p>
<script>
    // Notify parent window that auth failed
    window.parent.postMessage({ type: 'navigateToPage', href: '{{href}}'});
    // If parent redirect didn't work, redirect here
    setTimeout(function() {
        window.parent.location.href = '{{href}}';
    }, 2000);
</script>`


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
) {
    data.adminUsername = possiblyAuthedAdmin?.name ?? 'unknown user';
    data.adminIsMaster = possiblyAuthedAdmin && possiblyAuthedAdmin.isMaster;
    data.profilePicture = possiblyAuthedAdmin?.profilePicture ?? 'img/default_avatar.png';
    data.isTempPassword = possiblyAuthedAdmin && possiblyAuthedAdmin.isTempPassword;
    data.isLinux = !txEnv.isWindows;
    data.showAdvanced = (convars.isDevMode || console.isVerbose);

    try {
        return await loadWebTemplate(view).then(template => template(data));
    } catch (error) {
        return getRenderErrorText(view, error as Error, data);
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
        //Typescript is very annoying 
        const possiblyAuthedAdmin = ctx.admin as AuthedAdminType | undefined;

        //Setting up legacy theme
        let legacyTheme = '';
        const themeCookie = ctx.cookies.get('txAdmin-theme');
        if (!themeCookie || themeCookie === 'dark' || !isWebInterface) {
            legacyTheme = 'theme--dark';
        } else {
            const selectorTheme = tmpCustomThemes.find((theme) => theme.name === themeCookie);
            if (selectorTheme?.isDark) {
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
        ctx.body = await renderView(view, possiblyAuthedAdmin, renderData, ctx.txVars);
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

    //Legacy page util to navigate parent (react) to some page
    //NOTE: in use by deployer/stepper.js and setup/get.js
    const legacyNavigateToPage = (href: string) => {
        ctx.body = legacyNavigateHtmlTemplate.replace(/{{href}}/g, href);
        ctx.type = 'text/html';
    }

    const serveReactIndex = async () => {
        ctx.body = await getReactIndex(ctx);
        ctx.type = 'text/html';
    };

    //Injecting utils and forwarding
    ctx.utils = {
        render: renderUtil,
        error: errorUtil,
        serveReactIndex,
        legacyNavigateToPage,
    };
    ctx.send = <T = string | object>(data: T) => {
        ctx.body = data;
    };
    return next();
};
