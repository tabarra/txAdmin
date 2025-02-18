#!/usr/bin/env node
// npx tsc -p core/tsconfig.json --noEmit | ./scripts/typecheck-formatter.js

import chalk from 'chalk';

const filterOut = [
    `Cannot find name 'globals'.`,
    `Property 'body' does not exist on type 'Request'.`,
    `'ctx.params' is of type 'unknown'.`,
    `has not been built from source file`,
];

let rawInput = '';
process.stdin.on('data', (data) => {
    rawInput += data.toString('utf8');
});
process.stdin.on('end', () => {
    processInput(rawInput.trim());
});


function processInput(rawInput) {
    let errorCount = 0;
    const allLines = rawInput.split('\n');
    const filtered = allLines
        .filter(errorLine => errorLine.includes('error TS'))
        .filter(errorLine => !filterOut.some(filter => errorLine.includes(filter)));
    for (const errorLine of filtered) {
        // console.log(errorLine);
        const [file, tsError, desc] = errorLine.split(': ', 3);

        if (tsError) {
            errorCount++;
            console.log(chalk.yellow(file));
            console.log(`\t${chalk.red(desc)}`);
        } else {
            console.log(`\t${chalk.red(errorLine)}`);
        }
    }
    console.log('===========================');
    console.log('errorCount', errorCount);
}
