import path from 'node:path';
import fs from 'node:fs';
import JSON5 from 'json5';
import { defineConfig } from 'vitest/config';
import type { InlineConfig } from 'vitest/node';


//Detect the aliases from the tsconfig.json
const extractTsconfigAliases = (tsconfigPath: string) => {
    const tsconfig = JSON5.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const baseDir = path.dirname(tsconfigPath);
    const paths: Record<string, string[]> = tsconfig.compilerOptions?.paths ?? {};
    const aliases: InlineConfig['alias'] = {};
    for (const [aliasPattern, targetPaths] of Object.entries(paths)) {
        const alias = aliasPattern.replace('/*', '');
        const targetPath = targetPaths[0].replace('/*', '');
        aliases[alias] = path.resolve(baseDir, targetPath);
    }
    return aliases;
};

const resolvedAliases: InlineConfig['alias'] = {
    ...extractTsconfigAliases(path.resolve(__dirname, '../shared/tsconfig.json')),
    ...extractTsconfigAliases(path.resolve(__dirname, './tsconfig.json')),
};


export default defineConfig({
    test: {
        globalSetup: './testing/globalSetup.ts',
        setupFiles: ['./testing/fileSetup.ts'],
        alias: resolvedAliases,
    },
});
