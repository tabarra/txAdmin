const modulename = 'WebCtxUtils';
import fsp from "node:fs/promises";
import path from "node:path";
import { AdsDataType, InjectedTxConsts, ThemeType } from '@shared/otherTypes';
import { txEnv, convars } from "@core/globalData";
import { AuthedCtx, CtxWithVars } from "./ctxTypes";
import consts from "@shared/consts";
import consoleFactory from '@extras/console';
import { AuthedAdminType, checkRequestAuth } from "./authLogic";
const console = consoleFactory(modulename);

// NOTE: it's not possible to remove the hardcoded import of the entry point in the index.html file
// even if you set the entry point manually in the vite config.
// Therefore, it was necessary to tag it with `data-prod-only` so it can be removed in dev mode.

//Consts
const displayFxserverVersionPrefix = convars.isZapHosting && '/ZAP' || convars.isPterodactyl && '/Ptero' || '';
const displayFxserverVersion = `${txEnv.fxServerVersion}${displayFxserverVersionPrefix}`;
const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

//Cache the index.html file unless in dev mode
let htmlFile: string;

// NOTE: https://vitejs.dev/guide/backend-integration.html
const viteOrigin = process.env.TXADMIN_DEV_VITE_URL!;
const devModulesScript = `<script type="module">
        import { injectIntoGlobalHook } from "${viteOrigin}/@react-refresh";
        injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${viteOrigin}/@vite/client"></script>
    <script type="module" src="${viteOrigin}/src/main.tsx"></script>`;


//Custom themes placeholder
export const tmpDefaultTheme = 'dark';
export const tmpDefaultThemes = ['dark', 'light'];
export const tmpCustomThemes: ThemeType[] = [
    // {
    //     name: 'deep-purple',
    //     isDark: true,
    //     style: {
    //         "background": "274 93% 39%",
    //         "foreground": "269 9% 100%",
    //         "card": "274 79% 53%",
    //         "card-foreground": "270 48% 99%",
    //         "popover": "240 10% 3.9%",
    //         "popover-foreground": "270 48% 99%",
    //         "primary": "270 48% 99%",
    //         "primary-foreground": "240 5.9% 10%",
    //         "secondary": "240 3.7% 15.9%",
    //         "secondary-foreground": "270 48% 99%",
    //         "muted": "240 3.7% 15.9%",
    //         "muted-foreground": "240 5% 64.9%",
    //         "accent": "240 3.7% 15.9%",
    //         "accent-foreground": "270 48% 99%",
    //         "destructive": "0 62.8% 30.6%",
    //         "destructive-foreground": "270 48% 99%",
    //         "border": "273 79%, 53%",
    //         "input": "240 3.7% 15.9%",
    //         "ring": "240 4.9% 83.9%",
    //     }
    // }
];



/**
 * Returns the react index.html file with placeholders replaced
 * FIXME: add favicon
 */
export default async function getReactIndex(ctx: CtxWithVars | AuthedCtx) {
    //Read file if not cached
    if (convars.isDevMode || !htmlFile) {
        try {
            const indexPath = convars.isDevMode
                ? path.join(process.env.TXADMIN_DEV_SRC_PATH!, '/panel/index.html')
                : path.join(txEnv.txAdminResourcePath, 'panel/index.html')
            const rawHtmlFile = await fsp.readFile(indexPath, 'utf-8');

            //Remove tagged lines (eg hardcoded entry point) depending on env
            if (convars.isDevMode) {
                htmlFile = rawHtmlFile.replaceAll(/.+data-prod-only.+\r?\n/gm, '');
            } else {
                htmlFile = rawHtmlFile.replaceAll(/.+data-dev-only.+\r?\n/gm, '');
            }
        } catch (error) {
            if ((error as any).code == 'ENOENT') {
                return `<h1>⚠ index.html not found:</h1><pre>You probably deleted the 'citizen/system_resources/monitor/panel/index.html' file, or the folders above it.</pre>`;
            } else {
                return `<h1>⚠ index.html load error:</h1><pre>${(error as Error).message}</pre>`
            }
        }
    }

    //Checking if already logged in
    const authResult = checkRequestAuth(
        ctx.txAdmin,
        ctx.request.headers,
        ctx.ip,
        ctx.txVars.isLocalRequest,
        ctx.sessTools
    );
    let authedAdmin: AuthedAdminType | false = false;
    if (authResult.success) {
        authedAdmin = authResult.admin;
    }

    //Preparing vars
    const basePath = (ctx.txVars.isWebInterface) ? '/' : consts.nuiWebpipePath;
    const serverName = ctx.txAdmin.globalConfig.serverName || ctx.txAdmin.info.serverProfile;
    const injectedConsts = {
        //env
        fxsVersion: displayFxserverVersion,
        fxsOutdated: ctx.txAdmin.updateChecker.fxsUpdateData,
        txaVersion: txEnv.txAdminVersion,
        txaOutdated: ctx.txAdmin.updateChecker.txaUpdateData,
        serverTimezone,
        isZapHosting: convars.isZapHosting, //not in use
        isPterodactyl: convars.isPterodactyl, //not in use
        isWebInterface: ctx.txVars.isWebInterface,
        showAdvanced: (convars.isDevMode || console.isVerbose),
        hasMasterAccount: ctx.txAdmin.adminVault.hasAdmins(true),
        defaultTheme: tmpDefaultTheme,
        customThemes: tmpCustomThemes.map(({ name, isDark }) => ({ name, isDark })),
        adsData: ctx.txAdmin.dynamicAds.adData as AdsDataType,

        //auth
        preAuth: authedAdmin && authedAdmin.getAuthData(),
    } satisfies InjectedTxConsts;

    //Prepare placeholders
    const replacers: { [key: string]: string } = {};
    replacers.basePath = `<base href="${basePath}">`;
    replacers.ogTitle = `txAdmin - ${serverName}`;
    replacers.ogDescripttion = `Manage & Monitor your FiveM/RedM Server with txAdmin v${txEnv.txAdminVersion} atop FXServer ${txEnv.fxServerVersion}`;
    replacers.txConstsInjection = `<script>window.txConsts = ${JSON.stringify(injectedConsts)};</script>`;
    replacers.devModules = convars.isDevMode ? devModulesScript : '';

    //Prepare custom themes style tag
    if (tmpCustomThemes.length) {
        const cssThemes = [];
        for (const theme of tmpCustomThemes) {
            const cssVars = [];
            for (const [name, value] of Object.entries(theme.style)) {
                cssVars.push(`--${name}: ${value};`);
            }
            cssThemes.push(`.theme-${theme.name} { ${cssVars.join(' ')} }`);
        }
        replacers.customThemesStyle = `<style>${cssThemes.join('\n')}</style>`;
    } else {
        replacers.customThemesStyle = '';
    }

    //Setting the theme class from the cookie
    const themeCookie = ctx.cookies.get('txAdmin-theme');
    if(themeCookie){
        if(tmpDefaultThemes.includes(themeCookie)){
            replacers.htmlClasses = themeCookie;
        } else {
            const selectedCustomTheme = tmpCustomThemes.find((theme) => theme.name === themeCookie);
            if(!selectedCustomTheme){
                replacers.htmlClasses = tmpDefaultTheme;
            } else {
                const lightDarkSelector = selectedCustomTheme.isDark ? 'dark' : 'light';
                replacers.htmlClasses = `${lightDarkSelector} theme-${selectedCustomTheme.name}`;
            }
        }
    } else {
        replacers.htmlClasses = tmpDefaultTheme;
    }

    //Replace
    let htmlOut = htmlFile;
    for (const [placeholder, value] of Object.entries(replacers)) {
        const replacerRegex = new RegExp(`(<!--\\s*)?{{${placeholder}}}(\\s*-->)?`, 'g');
        htmlOut = htmlOut.replaceAll(replacerRegex, value);
    }

    //If in prod mode and NUI, replace the entry point with the local one
    //This is required because of how badly the WebPipe handles "large" files
    if (!convars.isDevMode){
        const base = ctx.txVars.isWebInterface ? `./` : `nui://monitor/panel/`;
        htmlOut = htmlOut.replace(/src="\.\/index-(\w+)\.js"/, `src="${base}index-$1.js"`);
        htmlOut = htmlOut.replace(/href="\.\/index-(\w+)\.css"/, `href="${base}index-$1.css"`);
    }

    return htmlOut;
}
