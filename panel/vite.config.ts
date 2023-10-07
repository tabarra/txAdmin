import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import config from '../.deploy.config.js';


const baseConfig = {
    build: {
        emptyOutDir: true,
        reportCompressedSize: false,
        outDir: '../dist/panel',
        minify: true,
        // target: 'chrome103',
        sourcemap: false,

        
        // generate manifest.json in outDir
        manifest: true,
        rollupOptions: {
            input: undefined, //placeholder

            //Doing this because fxserver's cicd doesn't wipe the dist folder
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: '[name].[ext]',
            }
        },
    },
    server: {
        origin: undefined, //placeholder
    },
    base: '',
    clearScreen: false,
    plugins: [
        // tsconfigPaths({
        //     projects: ['./', '../shared']
        // }),
        react()
    ]
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    if (command === 'serve') {
        baseConfig.server.origin = config.panelViteUrl;
        baseConfig.build.rollupOptions.input = './src/main.tsx'; // overwrite default .html entry
        
        return baseConfig;
    } else {
        return baseConfig;
    }
})
