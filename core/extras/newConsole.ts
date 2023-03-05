import { Console } from 'node:console';
import { InspectOptions } from 'node:util';
import { Writable } from 'node:stream';
import path from 'node:path';
import chalk from 'chalk';
import slash from 'slash';
import ErrorStackParser from 'error-stack-parser';
import sourceMapSupport from 'source-map-support'
import { txEnv, convars } from '../globalData';

/*
    FIXME: test styling notes
    - time dim, separated, tag with color and no bg
    - shorten txAdmin to tx?

    FIXME: add log buffer to be used by diagnostics report and system logs page
*/

//Variables
const header = 'txAdmin';
let internalVerboseFlag = true;

//If dev move, read sourcemap and change the path alias
let pathAliasFind: string;
if (convars.isDevMode) {
    sourceMapSupport.install();
    pathAliasFind = txEnv.txAdminResourcePath + '/core';
} else {
    pathAliasFind = txEnv.txAdminResourcePath!;
}


/**
 * New console and streams
 */
const defaultStream = new Writable({
    decodeStrings: true,
    defaultEncoding: 'utf8',
    write(chunk, encoding, callback) {
        //TODO: log stuff
        process.stdout.write(chunk);
        callback();
    },
});
const verboseStream = new Writable({
    decodeStrings: true,
    defaultEncoding: 'utf8',
    write(chunk, encoding, callback) {
        //TODO: log stuff
        if (internalVerboseFlag) process.stdout.write(chunk);
        callback();
    },
});
const defaultConsole = new Console({
    stdout: defaultStream,
    stderr: defaultStream,
    colorMode: true,
});
const verboseConsole = new Console({
    stdout: verboseStream,
    stderr: verboseStream,
    colorMode: true,
});


//Dir helpers
const cleanPath = (x: string) => { return slash(path.normalize(x)); };
const ERR_STACK_PREFIX = chalk.redBright('    =>');
const DIR_DIVIDER = chalk.cyan('================================');
const specialsColor = chalk.rgb(255, 228, 181).italic;
const lawngreenColor = chalk.rgb(124, 252, 0);
const orangeredColor = chalk.rgb(255, 69, 0);


/**
 * Parses an error and returns string with prettified error and stack
 * The stack filters out node modules and aliases monitor folder
 */
const getPrettyError = (error: Error) => {
    const out: string[] = [];

    //banner
    out.push(chalk.redBright(`[txAdmin] ${error.name}: `) + error.message);
    if ('type' in error) out.push(`${chalk.redBright('[txAdmin] Type:')} ${error.type}`);
    if ('code' in error) out.push(`${chalk.redBright('[txAdmin] Code:')} ${error.code}`);

    //stack
    if (typeof error.stack === 'string') {
        try {
            for (const line of ErrorStackParser.parse(error)) {
                if (line.fileName && line.fileName.startsWith('node:')) continue;
                const outPath = cleanPath(line.fileName ?? 'unknown').replace(pathAliasFind, '@monitor');
                const outPos = chalk.blueBright(`${line.lineNumber}:${line.columnNumber}`);
                const outName = chalk.yellowBright(line.functionName || '<unknown>');
                out.push(`${ERR_STACK_PREFIX} ${outPath} > ${outPos} > ${outName}`);
            }
        } catch (error) {
            out.push(`${chalk.redBright('[txAdmin]')} Unnable to parse stack.`);
        }
    } else {
        out.push(`${chalk.redBright('[txAdmin]')} Stack not available.`);
    }
    return out.join('\n');
}


/**
 * Drop-in replacement for console.dir
 */
const dirHandler = (data: any, options?: InspectOptions, consoleInstance?: Console) => {
    if (!consoleInstance) consoleInstance = defaultConsole;

    if (data instanceof Error) {
        consoleInstance.log(getPrettyError(data));
        consoleInstance.log();
    } else {
        consoleInstance.log(DIR_DIVIDER);
        if (data === undefined) {
            consoleInstance.log(specialsColor('> undefined'));
        } else if (data === null) {
            consoleInstance.log(specialsColor('> null'));
        } else if (data instanceof Promise) {
            consoleInstance.log(specialsColor('> Promise'));
        } else if (typeof data === 'boolean') {
            consoleInstance.log(data ? lawngreenColor('true') : orangeredColor('false'));
        } else {
            consoleInstance.dir(data, options);
        }
        consoleInstance.log(DIR_DIVIDER);
    }
}


/**
 * Cleans the terminal
 */
export const cleanTerminal = () => {
    process.stdout.write('.\n'.repeat(80) + '\x1B[2J\x1B[H');
}

/**
 * Sets terminal title
 */
export const setTTYTitle = (title: string) => {
    title = (title) ? `txAdmin v${txEnv.txAdminVersion}: ${title}` : 'txAdmin';
    process.stdout.write(`\x1B]0;${title}\x07`);
}

/**
 * Returns current ts in h23 format
 */
export const getTimestamp = () => (new Date).toLocaleString(
    undefined,
    { timeStyle: 'medium', hourCycle: 'h23' }
);


/**
 * Generates a custom log function with custom context and specific Console
 */
const getLogFunc = (currContext: string, color: Function, consoleInstance?: Console) => {
    return (message?: any, ...optParams: any) => {
        if (!consoleInstance) consoleInstance = defaultConsole;
        const currTime = getTimestamp();
        const timeTag = chalk.inverse(`[${currTime}]`);
        const headerTag = color(`[${currContext}]`);
        const prefix = `${timeTag}${headerTag}`;
        if (typeof message === 'string') {
            return consoleInstance.log.call(null, `${prefix} ${message}`, ...optParams);
        } else {
            return consoleInstance.log.call(null, prefix, message, ...optParams);
        }
    }
}


/**
 * Factory for console.log drop-ins
 */
const consoleFactory = (ctx?: string, subCtx?: string) => {
    const currContext = [header, ctx, subCtx].filter(x => x).join(':');

    return {
        ...defaultConsole,
        tag: (subCtx: string) => consoleFactory(ctx, subCtx),
        debug: getLogFunc(currContext, chalk.bold.bgMagenta),
        log: getLogFunc(currContext, chalk.bold.bgBlue),
        ok: getLogFunc(currContext, chalk.bold.bgGreen),
        warn: getLogFunc(currContext, chalk.bold.bgYellow),
        error: getLogFunc(currContext, chalk.bold.bgRed),
        dir: (data: any, options?: InspectOptions) => dirHandler.call(null, data, options),

        verbose: {
            debug: getLogFunc(currContext, chalk.bold.bgMagenta, verboseConsole),
            log: getLogFunc(currContext, chalk.bold.bgBlue, verboseConsole),
            ok: getLogFunc(currContext, chalk.bold.bgGreen, verboseConsole),
            warn: getLogFunc(currContext, chalk.bold.bgYellow, verboseConsole),
            error: getLogFunc(currContext, chalk.bold.bgRed, verboseConsole),
            dir: (data: any, options?: InspectOptions) => dirHandler.call(null, data, options, verboseConsole)
        },
        get isVerbose() { return internalVerboseFlag },
        setVerbose: (state: boolean) => { internalVerboseFlag = !!state; },
    };
};
export default consoleFactory;



/**
 * DEBUG testing code
 */

// const directStdoutPrint = (x: string) => process.stdout.write(x + '\n');

// // const console = consoleFactory('WebServer:ServerLogPartial');
// // const console = consoleFactory('FXRunner');
// const console = consoleFactory();

// directStdoutPrint(">>>>>>>>>>>>>>>>>>>>>>>>>>>>> default")
// console.debug('xxx');
// console.log('xxx');
// console.ok('xxx');
// console.warn('xxx');
// console.error('xxx');
// console.dir('xxx');
// directStdoutPrint(">>>>>>>>>>>>>>>>>>>>>>>>>>>>> verbose only")
// console.verbose.debug('xxx');
// console.verbose.log('xxx');
// console.verbose.ok('xxx');
// console.verbose.warn('xxx');
// console.verbose.error('xxx');
// console.verbose.dir('xxx');
// directStdoutPrint(">>>>>>>>>>>>>>>>>>>>>>>>>>>>> tag")
// console.log('root');
// console.tag('sub1').ok('sub');
