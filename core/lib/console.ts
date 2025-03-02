//NOTE: due to the monkey patching of the console, this should be imported before anything else
//      which means in this file you cannot import anything from inside txAdmin to prevent cyclical dependencies
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
const DEBUG_COLOR = chalk.bgHex('#FF45FF');
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
let stackPathAlias: { path: string, alias: string } | undefined;
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
        stackPathAlias = {
            path: txAdminResourcePath + '/core',
            alias: '@monitor',
        }
    } else {
        stackPathAlias = {
            path: txAdminResourcePath,
            alias: '@monitor',
        }
    }
}


/**
 * STDOUT EOL helper
 */
let stdioEolPending = false;
export const processStdioWriteRaw = (buffer: Uint8Array | string) => {
    if (!buffer.length) return;
    const comparator = typeof buffer === 'string' ? '\n' : 10;
    stdioEolPending = buffer[buffer.length - 1] !== comparator;
    process.stdout.write(buffer);
}
export const processStdioEnsureEol = () => {
    if (stdioEolPending) {
        process.stdout.write('\n');
        stdioEolPending = false;
    }
}


/**
 * New console and streams
 */
const defaultStream = new Writable({
    decodeStrings: true,
    defaultEncoding: 'utf8',
    highWaterMark: 64 * 1024,
    write(chunk, encoding, callback) {
        writeToBuffer(chunk)
        process.stdout.write(chunk);
        callback();
    },
});
const verboseStream = new Writable({
    decodeStrings: true,
    defaultEncoding: 'utf8',
    highWaterMark: 64 * 1024,
    write(chunk, encoding, callback) {
        writeToBuffer(chunk)
        if (_verboseFlag) process.stdout.write(chunk);
        callback();
    },
});
const defaultConsole = new Console({
    //@ts-ignore some weird change from node v16 to v22, check after update
    stdout: defaultStream,
    stderr: defaultStream,
    colorMode: true,
});
const verboseConsole = new Console({
    //@ts-ignore some weird change from node v16 to v22, check after update
    stdout: verboseStream,
    stderr: verboseStream,
    colorMode: true,
});


/**
 * Returns current ts in h23 format
 * FIXME: same thing as utils/misc.ts getTimeHms
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
const cleanPath = (x: string) => slash(path.normalize(x));
const ERR_STACK_PREFIX = chalk.redBright('    => ');
const DIVIDER_SIZE = 60;
const DIVIDER_CHAR = '=';
const DIVIDER = DIVIDER_CHAR.repeat(DIVIDER_SIZE);
const DIR_DIVIDER = chalk.cyan(DIVIDER);
const specialsColor = chalk.rgb(255, 228, 181).italic;
const lawngreenColor = chalk.rgb(124, 252, 0);
const orangeredColor = chalk.rgb(255, 69, 0);


/**
 * Parses an error and returns string with prettified error and stack
 * The stack filters out node modules and aliases monitor folder
 */
const getPrettyError = (error: Error, multilineError?: boolean) => {
    const out: string[] = [];
    const prefixStr = `[${getTimestamp()}][tx]`;
    let prefixColor = chalk.redBright;
    let nameColor = chalk.redBright;
    if (error.name === 'ExperimentalWarning') {
        prefixColor = chalk.bgYellow.black;
        nameColor = chalk.yellowBright;
    } else if (multilineError) {
        prefixColor = chalk.bgRed.black;
    }
    const prefix = prefixColor(prefixStr) + ' ';

    //banner
    out.push(prefix + nameColor(`${error.name}: `) + error.message);
    if ('type' in error) out.push(prefix + nameColor('Type:') + ` ${error.type}`);
    if ('code' in error) out.push(prefix + nameColor('Code:') + ` ${error.code}`);

    //stack
    if (typeof error.stack === 'string') {
        const stackPrefix = multilineError ? prefix : ERR_STACK_PREFIX;
        try {
            for (const line of ErrorStackParser.parse(error)) {
                if (line.fileName && line.fileName.startsWith('node:')) continue;
                let outPath = cleanPath(line.fileName ?? 'unknown');
                if(stackPathAlias){
                    outPath = outPath.replace(stackPathAlias.path, stackPathAlias.alias);
                }
                const outPos = chalk.blueBright(`${line.lineNumber}:${line.columnNumber}`);
                const outName = chalk.yellowBright(line.functionName || '<unknown>');
                if (!outPath.startsWith('@monitor/core')) {
                    out.push(chalk.dim(`${stackPrefix}${outPath} > ${outPos} > ${outName}`));
                } else {
                    out.push(`${stackPrefix}${outPath} > ${outPos} > ${outName}`);
                }
            }
        } catch (error) {
            out.push(`${prefix} Unnable to parse error stack.`);
        }
    } else {
        out.push(`${prefix} Error stack not available.`);
    }
    return out.join('\n');
}


/**
 * Drop-in replacement for console.dir
 */
const dirHandler = (data: any, options?: TxInspectOptions, consoleInstance?: Console) => {
    if (!consoleInstance) consoleInstance = defaultConsole;

    if (data instanceof Error) {
        consoleInstance.log(getPrettyError(data, options?.multilineError));
        if (!options?.multilineError) consoleInstance.log();
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

type TxInspectOptions = InspectOptions & {
    multilineError?: boolean;
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
export const setTTYTitle = (title?: string) => {
    const txVers = _txAdminVersion ? `txAdmin v${_txAdminVersion}` : 'txAdmin';
    const out = title ? `${title} - txAdmin` : txVers;
    process.stdout.write(`\x1B]0;${out}\x07`);
}


/**
 * Generates a custom log function with custom context and specific Console
 */
const getLogFunc = (
    currContext: string,
    color: ChalkInstance,
    consoleInstance?: Console,
): LogFunction => {
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

//Reused types
type LogFunction = typeof Console.prototype.log;
type DirFunction = (data: any, options?: TxInspectOptions) => void;
interface TxBaseLogTypes {
    debug: LogFunction;
    log: LogFunction;
    ok: LogFunction;
    warn: LogFunction;
    error: LogFunction;
    dir: DirFunction;
}


/**
 * Factory for console.log drop-ins
 */
const consoleFactory = (ctx?: string, subCtx?: string): CombinedConsole => {
    const currContext = [header, ctx, subCtx].filter(x => x).join(':');
    const baseLogs: TxBaseLogTypes = {
        debug: getLogFunc(currContext, DEBUG_COLOR),
        log: getLogFunc(currContext, chalk.bgBlue),
        ok: getLogFunc(currContext, chalk.bgGreen),
        warn: getLogFunc(currContext, chalk.bgYellow),
        error: getLogFunc(currContext, chalk.bgRed),
        dir: (data: any, options?: TxInspectOptions & {}) => dirHandler.call(null, data, options),
    };

    return {
        ...defaultConsole,
        ...baseLogs,
        tag: (subCtx: string) => consoleFactory(ctx, subCtx),
        multiline: (text: string | string[], color: ChalkInstance) => {
            if (!Array.isArray(text)) text = text.split('\n');
            const prefix = genLogPrefix(currContext, color);
            for (const line of text) {
                defaultConsole.log(prefix, line);
            }
        },

        /**
         * Prints a multiline error message with a red background
         * @param text 
         */
        majorMultilineError: (text: string | (string | null)[]) => {
            if (!Array.isArray(text)) text = text.split('\n');
            const prefix = genLogPrefix(currContext, chalk.bgRed);
            defaultConsole.log(prefix, DIVIDER);
            for (const line of text) {
                if (line) {
                    defaultConsole.log(prefix, line);
                } else {
                    defaultConsole.log(prefix, DIVIDER);
                }
            }
            defaultConsole.log(prefix, DIVIDER);
        },

        //Returns a set of log functions that will be executed after a delay
        defer: (ms = 250) => ({
            debug: (...args) => setTimeout(() => baseLogs.debug(...args), ms),
            log: (...args) => setTimeout(() => baseLogs.log(...args), ms),
            ok: (...args) => setTimeout(() => baseLogs.ok(...args), ms),
            warn: (...args) => setTimeout(() => baseLogs.warn(...args), ms),
            error: (...args) => setTimeout(() => baseLogs.error(...args), ms),
            dir: (...args) => setTimeout(() => baseLogs.dir(...args), ms),
        }),

        //Log functions that will output tothe verbose stream
        verbose: {
            debug: getLogFunc(currContext, DEBUG_COLOR, verboseConsole),
            log: getLogFunc(currContext, chalk.bgBlue, verboseConsole),
            ok: getLogFunc(currContext, chalk.bgGreen, verboseConsole),
            warn: getLogFunc(currContext, chalk.bgYellow, verboseConsole),
            error: getLogFunc(currContext, chalk.bgRed, verboseConsole),
            dir: (data, options) => dirHandler.call(null, data, options, verboseConsole)
        },

        //Verbosity getter and explicit setter
        get isVerbose() {
            return _verboseFlag
        },
        setVerbose: (state: boolean) => {
            _verboseFlag = !!state;
        },

        //Consts used by the fatalError util
        DIVIDER,
        DIVIDER_CHAR,
        DIVIDER_SIZE,
    };
};
export default consoleFactory;

interface CombinedConsole extends TxConsole, Console {
    dir: DirFunction;
}

export interface TxConsole extends TxBaseLogTypes {
    tag: (subCtx: string) => TxConsole;
    multiline: (text: string | string[], color: ChalkInstance) => void;
    majorMultilineError: (text: string | (string | null)[]) => void;
    defer: (ms?: number) => TxBaseLogTypes;
    verbose: TxBaseLogTypes;
    readonly isVerbose: boolean;
    setVerbose: (state: boolean) => void;
    DIVIDER: string;
    DIVIDER_CHAR: string;
    DIVIDER_SIZE: number;
}


/**
 * Replaces the global console with the new one
 */
global.console = consoleFactory();
