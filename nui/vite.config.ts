import path from 'node:path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

import { getFxsPaths } from '../scripts/scripts-utils.js'
import config from '../.deploy.config.js';
//FIXME: probably better to use .env with deploypath, sv_licensekey, etc

const baseConfig = {
    build: {
        emptyOutDir: true,
        reportCompressedSize: false,
        outDir: '../dist/nui',
        minify: true,
        target: 'chrome103',
        sourcemap: false,

        //Doing this because fxserver's cicd doesn't wipe the dist folder
        rollupOptions: {
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: '[name].[ext]',
            }
        },
    },
    base: '/nui/',
    clearScreen: false,
    plugins: [
        tsconfigPaths({
            projects: ['./', '../shared']
        }),
        react()
    ]
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    if (mode === 'devNuiBrowser') {
        console.log('Launching NUI in browser mode')
        return baseConfig
    }

    if (mode === 'development') {
        let devDeplyPath;
        try {
            const { monitorPath } = getFxsPaths(config.fxserverPath);
            devDeplyPath = path.join(monitorPath, 'nui');
        } catch (error) {
            console.error('Could not extract/validate the fxserver and monitor paths.');
            console.error(error);
            process.exit(1);
        }

        baseConfig.build.outDir = devDeplyPath;
        baseConfig.build.minify = false;

        //DEBUG sourcemap is super slow
        // baseConfig.build.sourcemap = true;
        return baseConfig;
    } else {
        return baseConfig;
    }
})
