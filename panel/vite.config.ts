import path from 'node:path';
import { visualizer } from "rollup-plugin-visualizer";
import { PluginOption, UserConfig, defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// import tsconfigPaths from 'vite-tsconfig-paths';
import { licenseBanner } from '../scripts/build/utils';
import { parseTxDevEnv } from '../shared/txDevEnv';
process.loadEnvFile('../.env');

//Check if TXDEV_VITE_URL is set
const txDevEnv = parseTxDevEnv();
if (!txDevEnv.VITE_URL) {
    console.error('Missing TXDEV_VITE_URL env variable.');
    process.exit(1);
}


const baseConfig = {
    build: {
        emptyOutDir: true,
        outDir: '../dist/panel',
        minify: true,
        sourcemap: undefined, // placeholder

        // generate manifest.json in outDir
        manifest: true,
        rollupOptions: {
            input: undefined, //placeholder

            output: {
                banner: licenseBanner('..', true),
                //Adding hash to help with cache busting
                hashCharacters: 'base36',
                entryFileNames: `[name]-[hash].v800.js`,
                chunkFileNames: `[name]-[hash].v800.js`,
                assetFileNames: '[name]-[hash].v800.[ext]',
            }
        },
    },
    server: {
        origin: undefined, //placeholder
    },
    base: '',
    clearScreen: false,
    plugins: [
        react(),
        visualizer({
            // template: 'flamegraph',
            // template: 'sunburst',
            gzipSize: true,
            filename: '../.reports/panel_bundle.html',
        }),
    ] as PluginOption[], //i gave up
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@shared": path.resolve(__dirname, "../shared"),
        },
    },
} satisfies UserConfig;

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    if (command === 'serve') {
        baseConfig.server.origin = txDevEnv.VITE_URL;
        baseConfig.build.rollupOptions.input = './src/main.tsx'; // overwrite default .html entry
        return baseConfig;
    } else {
        baseConfig.build.sourcemap = true;
        return baseConfig;
    }
})
