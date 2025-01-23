import path from 'node:path';
import { visualizer } from "rollup-plugin-visualizer";
import { PluginOption, UserConfig, defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getFxsPaths, licenseBanner } from '../scripts/build/utils';
import { parseTxDevEnv } from '../shared/txDevEnv';
process.loadEnvFile('../.env');

//Check if TXDEV_FXSERVER_PATH is set
const txDevEnv = parseTxDevEnv();
if (!txDevEnv.FXSERVER_PATH) {
    console.error('Missing TXDEV_FXSERVER_PATH env variable.');
    process.exit(1);
}

const baseConfig = {
    build: {
        emptyOutDir: true,
        reportCompressedSize: false,
        outDir: '../dist/nui',
        minify: true as boolean,
        target: 'chrome103',
        sourcemap: false,

        rollupOptions: {
            output: {
                banner: licenseBanner('..', true),
                //Doing this because fxserver's cicd doesn't wipe the dist folder
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
        react(),
        visualizer({
            // template: 'flamegraph',
            // template: 'sunburst',
            gzipSize: true,
            filename: '../.reports/nui_bundle.html',
        }),
    ] as PluginOption[], //i gave up
} satisfies UserConfig;

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    if (mode === 'devNuiBrowser') {
        console.log('Launching NUI in browser mode')
        return baseConfig
    }

    if (mode === 'development') {
        let devDeplyPath: string;
        try {
            //Extract paths and validate them
            const fxsPaths = getFxsPaths(txDevEnv.FXSERVER_PATH);
            devDeplyPath = path.join(fxsPaths.monitor, 'nui');
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
