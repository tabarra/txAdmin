const modulename = 'WebCtxUtils';
import fsp from "node:fs/promises";
import path from "node:path";
import { InjectedTxConsts } from '@shared/InjectedTxConstsType';
import { txEnv, convars } from "@core/globalData";
import { AuthedCtx, CtxWithVars } from "./ctxTypes";
import consts from "@extras/consts";
import consoleFactory from '@extras/console';
import { AuthedAdminType, checkRequestAuth } from "./authLogic";
const console = consoleFactory(modulename);

// NOTE: it's not possible to remove the hardcoded import of the entry point in the index.html file
// even if you set the entry point manually in the vite config.
// Therefore, it was necessary to tag it with `data-prod-only` so it can be removed in dev mode.

//Consts
const displayFxserverVersionPrefix = convars.isZapHosting && '/ZAP' || convars.isPterodactyl && '/Ptero' || '';
const displayFxserverVersion = `${txEnv.fxServerVersion}${displayFxserverVersionPrefix}`;

//Cache the index.html file unless in dev mode
let htmlFile: string;

// NOTE: https://vitejs.dev/guide/backend-integration.html
const viteOrigin = process.env.TXADMIN_DEV_VITE_URL!;
const devModulesScript = `<!-- Dev scripts required for HMR -->
    <script type="module">
        import { injectIntoGlobalHook } from "${viteOrigin}/@react-refresh";
        injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${viteOrigin}/@vite/client"></script>
    <script type="module" src="${viteOrigin}/src/main.tsx"></script>`;


/**
 * Returns the react index.html file with placeholders replaced
 * FIXME: add favicon
 * FIXME: add dark mode
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
        fxServerVersion: displayFxserverVersion,
        txAdminVersion: txEnv.txAdminVersion,
        isZapHosting: convars.isZapHosting, //not in use
        isPterodactyl: convars.isPterodactyl, //not in use
        isWebInterface: ctx.txVars.isWebInterface,
        showAdvanced: (convars.isDevMode || console.isVerbose),

        //auth
        preAuth: authedAdmin && {
            name: authedAdmin.name,
            isMaster: authedAdmin.isMaster,
            permissions: authedAdmin.permissions,
            isTempPassword: authedAdmin.isTempPassword,
            profilePicture: authedAdmin.profilePicture,
            csrfToken: authedAdmin.csrfToken, //might not exist
        },
    } satisfies InjectedTxConsts;

    //Prepare placeholders
    const replacers: { [key: string]: string } = {};
    replacers.basePath = `<base href="${basePath}">`;
    replacers.ogTitle = `txAdmin - ${serverName}`;
    replacers.ogDescripttion = `Manage & Monitor your FiveM/RedM Server with txAdmin v${txEnv.txAdminVersion} atop FXServer ${txEnv.fxServerVersion}`;
    replacers.txConstsInjection = `<!-- Injected Consts -->
        <script>
            window.txConsts = ${JSON.stringify(injectedConsts)};
        </script>`;
    replacers.devModules = convars.isDevMode ? devModulesScript : '';

    //Replace
    let htmlOut = htmlFile;
    for (const [placeholder, value] of Object.entries(replacers)) {
        const replacerRegex = new RegExp(`(<!--\\s*)?{{${placeholder}}}(\\s*-->)?`, 'g');
        htmlOut = htmlOut.replaceAll(replacerRegex, value);
    }

    return htmlOut;
}
