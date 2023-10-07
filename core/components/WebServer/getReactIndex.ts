import fsp from "node:fs/promises";
import path from "node:path";
import { txEnv, convars } from "@core/globalData";

//Cache the index.html file unless in dev mode
let rawHtmlFile: string;


/**
 * Returns the react index.html file with placeholders replaced
 * FIXME: add favicon
 * FIXME: add dark mode
 */
export default async function getReactIndex(basePath: string, serverName: string, jsInjection: string) {
    //Read file if not cached
    if (convars.isDevMode || !rawHtmlFile) {
        try {
            const indexPath = convars.isDevMode
                ? path.join(process.env.TXADMIN_DEV_SRC_PATH!, '/panel/index.html')
                : path.join(txEnv.txAdminResourcePath, 'panel/index.html')
            rawHtmlFile = await fsp.readFile(indexPath, 'utf-8');
        } catch (error) {
            if ((error as any).code == 'ENOENT') {
                return `<h1>⚠ index.html not found:</h1><pre>You probably deleted the 'citizen/system_resources/monitor/panel/index.html' file, or the folders above it.</pre>`;
            } else {
                return `<h1>⚠ index.html load error:</h1><pre>${(error as Error).message}</pre>`
            }
        }
    }

    //Prepare placeholders
    const replacers: { [key: string]: string } = {};
    replacers.basePath = `<base href="${basePath}">`;
    replacers.ogTitle = `txAdmin - ${serverName}`;
    replacers.ogDescripttion = `Manage & Monitor your FiveM/RedM Server with txAdmin v${txEnv.txAdminVersion} atop FXServer ${txEnv.fxServerVersion}`;
    replacers.jsInjection = `<script>${jsInjection}</script>`;
    if (convars.isDevMode) {
        const viteOrigin = process.env.TXADMIN_DEV_VITE_URL!;
        // ref: https://vitejs.dev/guide/backend-integration.html
        replacers.devModule = `<!-- Dev scripts required for HMR -->
            <script type="module">
                import { injectIntoGlobalHook } from "${viteOrigin}/@react-refresh";
                injectIntoGlobalHook(window);
                window.$RefreshReg$ = () => {};
                window.$RefreshSig$ = () => (type) => type;
                window.__vite_plugin_react_preamble_installed__ = true;
            </script>
            <script type="module" src="${viteOrigin}/@vite/client"></script>`;
            replacers.entryPoint = `<script type="module" src="${viteOrigin}/src/main.tsx"></script>`;
    }else{
        replacers.entryPoint = `<script type="module" crossorigin src="./index.js"></script>`;
    }

    //Replace
    let htmlOut = rawHtmlFile;
    for (const [placeholder, value] of Object.entries(replacers)) {
        const replacerRegex = new RegExp(`(<!--\\s*)?{{${placeholder}}}(\\s*-->)?`, 'g');
        htmlOut = htmlOut.replaceAll(replacerRegex, value);
    }

    return htmlOut;
}
