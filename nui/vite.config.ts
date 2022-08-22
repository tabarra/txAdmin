import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

//FIXME: read config file
const devDeplyPath = 'E:\\FiveM\\BUILDS\\5811\\citizen\\system_resources\\monitor\\nui';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  build: {
    emptyOutDir: true,
    sourcemap: (mode === 'development') ? 'inline' : false,
    outDir: (mode === 'development') ? devDeplyPath : '../dist/nui',

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
