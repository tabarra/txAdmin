//NOTE: This script is not perfect, it was quickly made to help with the migration to the new package system.

import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

//Get list of all dependencies in package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const dependencies = new Set(Object.keys(packageJson.dependencies).concat(Object.keys(packageJson.devDependencies)));

//Get target folder path
const targetPath = process.argv[2];
if (typeof targetPath !== 'string' || !targetPath.length) {
    console.log('Invalid target package name');
    process.exit(1);
}
console.clear();
console.log('Scanning for dependencies in:', chalk.blue(targetPath));


//NOTE: To generate this list, use `node -pe "require('repl')._builtinLibs"` in both node16 and 22, then merge them.
const builtInModules = [
    'assert', 'assert/strict', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'dns/promises', 'domain', 'events', 'fs', 'fs/promises', 'http', 'http2', 'https', 'inspector', 'inspector/promises', 'module', 'net', 'os', 'path', 'path/posix', 'path/win32', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline', 'readline/promises', 'repl', 'stream', 'stream/consumers', 'stream/promises', 'stream/web', 'string_decoder', 'sys', 'test/reporters', 'timers', 'timers/promises', 'tls', 'trace_events', 'tty', 'url', 'util', 'util/types', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
];


//Process file and extract all dependencies
const allDependencies = new Set();
const ignoredPrefixes = [
    'node:',
    './',
    '../',
    '@shared',
    '@utils',
    '@logic',
    '@modules',
    '@routes',
    '@core',
    '@locale/',
    '@nui/',
    '@shared/',
];
const importRegex = /import\s+.+\s+from\s+['"](.*)['"]/gm;
const processFile = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const matches = [...fileContent.matchAll(importRegex)].map((match) => match[1]);
    for (const importedModule of matches) {
        if (ignoredPrefixes.some((prefix) => importedModule.startsWith(prefix))) continue;
        if (!importedModule) {
            console.log(chalk.red(`[ERROR] Invalid import in file: ${filePath}: ${importedModule}`));
            continue;
        }
        if (builtInModules.includes(importedModule)) {
            console.log(chalk.red(`[ERROR] builtin module '${importedModule}' without 'node:' from: ${filePath}`));
            continue;
        }
        if (importedModule === '.') {
            console.log(chalk.red(`[ERROR] Invalid import in file: ${filePath}: ${importedModule}`));
            continue;
        }
        if (!dependencies.has(importedModule)) {
            console.log(chalk.yellow(`[WARN] imported module '${importedModule}' not found in package.json`));
            continue;
        }
        allDependencies.add(importedModule);
    }
};


//Recursively read all files in the targetPath and its subfolders
const validExtensions = ['.cjs', '.js', '.ts', '.jsx', '.tsx'];
const processFolder = (dirPath) => {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
        const currFilePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
            processFolder(currFilePath);
        } else if (!file.isFile()) {
            console.log(chalk.red(`[ERROR] Invalid file: ${currFilePath}`));
        } else if (!validExtensions.includes(path.extname(currFilePath))) {
            console.log(chalk.grey(`[INFO] Ignoring file: ${currFilePath}`));
        } else {
            processFile(currFilePath);
        }
    }
};
processFolder(targetPath);
console.log(allDependencies);
