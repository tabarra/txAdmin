import { Console } from 'node:console';
import { InspectOptions } from 'node:util';
import { Writable } from 'node:stream';
import path from 'node:path';
import chalk, { ChalkInstance } from 'chalk';
import slash from 'slash';
import ErrorStackParser from 'error-stack-parser';
import sourceMapSupport from 'source-map-support';


//Buffer handler
//NOTE: the buffer will take between 64~72kb
const headBufferLimit = 8 * 1024; //4kb
const bodyBufferLimit = 64 * 1024; //64kb
const bodyTrimSliceSize = 8 * 1024;
const BUFFER_CUT_WARNING = chalk.bgRgb(255, 69, 0)('[!] The log body was sliced to prevent memory exhaustion. [!]');
let headBuffer = '';
let bodyBuffer = '';

const writeToBuffer = (chunk: string) => {
    //if head not full yet
    if (headBuffer.length + chunk.length < headBufferLimit) {
        headBuffer += chunk;
        return;
    }

    //write to body and trim if needed
    bodyBuffer += chunk;
    if (bodyBuffer.length > bodyBufferLimit) {
        let trimmedBody = bodyBuffer.slice(bodyTrimSliceSize - bodyBufferLimit);
        trimmedBody = trimmedBody.substring(trimmedBody.indexOf('\n'));
        bodyBuffer = `\n${BUFFER_CUT_WARNING}\n${trimmedBody}`;
    }
}

export const getLogBuffer = () => headBuffer + bodyBuffer;


//Variables
const header = 'tx';
const stackPathAliases: [string, string][] = [];
let _txAdminVersion: string | undefined;
let _verboseFlag = false;

export const setConsoleEnvData = (
    txAdminVersion: string,
    txAdminResourcePath: string,
    isDevMode: boolean,
    isVerbose: boolean,
) => {
    _txAdminVersion = txAdminVersion;
    _verboseFlag = isVerbose;
    if (isDevMode) {
        sourceMapSupport.install();
        //for some reason when using sourcemap it ends up with core/core/
        stackPathAliases.push([txAdminResourcePath + '/core', '@monitor']);
    } else {
        stackPathAliases.push([txAdminResourcePath, '@monitor']);
    }
}


/**
 * New console and streams
 */
const defaultStream = new Writable({
    decodeStrings: true,
    defaultEncoding: 'utf8',
    write(chunk, encoding, callback) {
        writeToBuffer(chunk)
        process.stdout.write(chunk);
        callback();
    },
});
const verboseStream = new Writable({
    decodeStrings: true,
    defaultEncoding: 'utf8',
    write(chunk, encoding, callback) {
        writeToBuffer(chunk)
        if (_verboseFlag) process.stdout.write(chunk);
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


/**
 * Returns current ts in h23 format
 */
export const getTimestamp = () => (new Date).toLocaleString(
    undefined,
    { timeStyle: 'medium', hourCycle: 'h23' }
);


/**
 * Generated the colored log prefix (ts+tags)
 */
export const genLogPrefix = (currContext: string, color: ChalkInstance) => {
    return color.black(`[${getTimestamp()}][${currContext}]`);
}


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
    const prefix = `[${getTimestamp()}][tx]`;

    //banner
    out.push(chalk.redBright(`${prefix} ${error.name}: `) + error.message);
    if ('type' in error) out.push(chalk.redBright(`${prefix} Type:`) + ` ${error.type}`);
    if ('code' in error) out.push(chalk.redBright(`${prefix} Code:`) + ` ${error.code}`);

    //stack
    if (typeof error.stack === 'string') {
        try {
            for (const line of ErrorStackParser.parse(error)) {
                if (line.fileName && line.fileName.startsWith('node:')) continue;
                let outPath = cleanPath(line.fileName ?? 'unknown');
                for (const [find, replace] of stackPathAliases) {
                    outPath = outPath.replace(find, replace);
                }
                const outPos = chalk.blueBright(`${line.lineNumber}:${line.columnNumber}`);
                const outName = chalk.yellowBright(line.functionName || '<unknown>');
                if(!outPath.startsWith('@monitor/core')){
                    out.push(chalk.dim(`${ERR_STACK_PREFIX} ${outPath} > ${outPos} > ${outName}`));
                }else{
                    out.push(`${ERR_STACK_PREFIX} ${outPath} > ${outPos} > ${outName}`);
                }
            }
        } catch (error) {
            out.push(chalk.redBright(prefix) + ` Unnable to parse error stack.`);
        }
    } else {
        out.push(chalk.redBright(prefix) + ` Error stack not available.`);
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
    const tx = _txAdminVersion ? `txAdmin v${_txAdminVersion}` : 'txAdmin';
    const out = (title) ? `${tx}: ${title}` : tx;
    process.stdout.write(`\x1B]0;${out}\x07`);
}


/**
 * Generates a custom log function with custom context and specific Console
 */
const getLogFunc = (currContext: string, color: ChalkInstance, consoleInstance?: Console) => {
    return (message?: any, ...optParams: any) => {
        if (!consoleInstance) consoleInstance = defaultConsole;
        const prefix = genLogPrefix(currContext, color);
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
        debug: getLogFunc(currContext, chalk.bgMagenta),
        log: getLogFunc(currContext, chalk.bgBlue),
        ok: getLogFunc(currContext, chalk.bgGreen),
        warn: getLogFunc(currContext, chalk.bgYellow),
        error: getLogFunc(currContext, chalk.bgRed),
        dir: (data: any, options?: InspectOptions) => dirHandler.call(null, data, options),
        multiline: (text: string | string[], color: ChalkInstance) => {
            if (!Array.isArray(text)) text = text.split('\n');
            const prefix = genLogPrefix(currContext, color);
            for (const line of text) {
                defaultConsole.log(prefix, line);
            }
        },
        majorMultilineError: (text: string | string[]) => {
            if (!Array.isArray(text)) text = text.split('\n');
            const prefix = genLogPrefix(currContext, chalk.bgRed);
            const sep = '='.repeat(60);
            defaultConsole.log(prefix, sep);
            for (const line of text) {
                defaultConsole.log(prefix, line);
            }
            defaultConsole.log(prefix, sep);
        },

        verbose: {
            debug: getLogFunc(currContext, chalk.bgMagenta, verboseConsole),
            log: getLogFunc(currContext, chalk.bgBlue, verboseConsole),
            ok: getLogFunc(currContext, chalk.bgGreen, verboseConsole),
            warn: getLogFunc(currContext, chalk.bgYellow, verboseConsole),
            error: getLogFunc(currContext, chalk.bgRed, verboseConsole),
            dir: (data: any, options?: InspectOptions) => dirHandler.call(null, data, options, verboseConsole)
        },
        get isVerbose() { return _verboseFlag },
        setVerbose: (state: boolean) => { _verboseFlag = !!state; },
    };
};
export default consoleFactory;


/**
 * Replaces the global console with the new one
 */
global.console = consoleFactory('Global');


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
