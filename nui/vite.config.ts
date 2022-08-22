import path from 'node:path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { getFxsPaths } from '../scripts/scripts-utils.js'
import config from '../.deploy.config.js';
//FIXME: probably better to use .env with deploypath, sv_licensekey, etc

let monitorPath;
try {
  ({ monitorPath } = getFxsPaths(config.fxserverPath));
} catch (error) {
  console.error('Could not extract/validate the fxserver and monitor paths.');
  console.error(error);
  process.exit(1);
}

const devDeplyPath = path.join(monitorPath, 'nui')

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  build: {
    emptyOutDir: true,
    reportCompressedSize: false,
    outDir: (mode === 'development') ? devDeplyPath : '../dist/nui',
    minify: (mode !== 'development'),
    target: 'chrome91',

    //DEBUG sourcemap is super slow
    // sourcemap: (mode === 'development') ? 'inline' : false,

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
  plugins: [react()]
}))
