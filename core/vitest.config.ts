import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        alias: {
            //must match the tsconfig paths
            "@shared": path.resolve(__dirname, "../shared"),
            "@extras": path.resolve(__dirname, "./extras"),
            "@core": path.resolve(__dirname, "./"),
        },

    },
});
