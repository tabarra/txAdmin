import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import isLocalhost from 'is-localhost-ip';
import { convars } from '@core/globalData';
import consoleFactory from '@extras/console';
const console = consoleFactory();


/**
 * Detect the dominant newline character of a string.
 * Extracted from https://www.npmjs.com/package/detect-newline
 */
const detectNewline = (str: string) => {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
    }

    const newlines = str.match(/(?:\r?\n)/g) || [];

    if (newlines.length === 0) {
        return;
    }

    const crlf = newlines.filter((newline) => newline === '\r\n').length;
    const lf = newlines.length - crlf;

    return crlf > lf ? '\r\n' : '\n';
};


/**
 * Helper function to store commands
 */
class Command {
    readonly command: string;
    readonly args: string[];
    readonly file: string;
    readonly line: number;

    constructor(tokens: string[], filePath: string, fileLine: number) {
        if (!Array.isArray(tokens) || tokens.length < 1) {
            throw new Error('Invalid command format');
        }
        if (typeof tokens[0] === 'string' && tokens[0].length) {
            this.command = tokens[0].toLocaleLowerCase();
        } else {
            this.command = 'invalid_empty_command';
        }
        this.args = tokens.slice(1);
        this.file = filePath;
        this.line = fileLine;
    }

    //Kinda confusing name, but it returns the value of a set if it's for that ne var
    getSetForVariable(varname: string) {
        if (
            ['set', 'sets', 'setr'].includes(this.command)
            && this.args.length === 2
            && this.args[0].toLowerCase() === varname.toLowerCase()
        ) {
            return this.args[1];
        }

        if (
            this.command === varname.toLowerCase()
            && this.args.length === 1
        ) {
            return this.args[0];
        }

        return false;
    }
}


/**
 * Helper function to store exec errors
 */
class ExecRecursionError {
    constructor(readonly file: string, readonly message: string, readonly line: number) { }
}

/**
 * Helper class to store file TODOs, errors and warnings
 */
class FilesInfoList {
    readonly store: Record<string, [number | false, string][]> = {};

    constructor() { }
    add(file: string, line: number | false, msg: string) {
        if (Array.isArray(this.store[file])) {
            this.store[file].push([line, msg]);
        } else {
            this.store[file] = [[line, msg]];
        }
    }
    count() {
        return Object.keys(this.store).length;
    }
    toJSON() {
        return this.store;
    }
    toMarkdown() {
        const files = Object.keys(this.store);
        if (!files) return null;

        const msgLines = [];
        for (const file of files) {
            const fileInfos = this.store[file];
            msgLines.push(`\`${file}\`:`);
            fileInfos.forEach(([line, msg]) => {
                const linePrefix = line ? `Line ${line}: ` : '';
                msgLines.push(`\t${linePrefix}${msg}`);
            });
        }
        return msgLines.join('\n');
    }
}


/**
 * Returns the first likely server.cfg given a server data path, or false
 */
export const findLikelyCFGPath = (serverDataPath: string) => {
    const attempts = [
        'server.cfg',
        'server.cfg.txt',
        'server.cfg.cfg',
        'server.txt',
        'server',
        '../server.cfg',
    ];

    for (const attempt of attempts) {
        const cfgPath = path.join(serverDataPath, attempt);
        try {
            if (fs.lstatSync(cfgPath).isFile()) {
                return cfgPath;
            }
        } catch (error) { }
    }
    return false;
}


/**
 * Returns the absolute path of the given CFG Path
 */
export const resolveCFGFilePath = (cfgPath: string, serverDataPath: string) => {
    return (path.isAbsolute(cfgPath)) ? path.normalize(cfgPath) : path.resolve(serverDataPath, cfgPath);
};


/**
 * Reads CFG Path and return the file contents, or throw error if:
 *  - the path is not valid (must be absolute)
 *  - cannot read the file data
 */
export const readRawCFGFile = async (cfgPath: string) => {
    //Validating if the path is absolute
    if (!path.isAbsolute(cfgPath)) {
        throw new Error('File path must be absolute.');
    }

    //Validating file existence
    if (!fs.existsSync(cfgPath)) {
        throw new Error("File doesn't exist or its unreadable.");
    }

    //Validating if its actually a file
    if (!fs.lstatSync(cfgPath).isFile()) {
        throw new Error("File doesn't exist or its unreadable. Make sure to include the CFG file in the path, and not just the directory that contains it.");
    }

    //Reading file
    try {
        return await fsp.readFile(cfgPath, 'utf8');
    } catch (error) {
        throw new Error('Cannot read CFG file.');
    }
};


/**
 * Parse a cfg/console line and return an array of commands with tokens.
 * Notable difference: we don't handle inline block comment
 * Original Line Parser:
 *  fivem/code/client/citicore/console/Console.cpp > ProgramArguments Tokenize
 */
export const readLineCommands = (input: string) => {
    let inQuote = false;
    let inEscape = false;
    const prevCommands = [];
    let currCommand = [];
    let currToken = '';
    for (let i = 0; i < input.length; i++) {
        if (inEscape) {
            if (input[i] === '"' || input[i] === '\\') {
                currToken += input[i];
            }
            inEscape = false;
            continue;
        }

        if (!currToken.length) {
            if (
                input.slice(i, i + 2) === '//'
                || input.slice(i, i + 2) === '/*'
                || input[i] === '#'
            ) {
                break;
            }
        }

        if (!inQuote && input.charCodeAt(i) <= 32) {
            if (currToken.length) {
                currCommand.push(currToken);
                currToken = '';
            }
            continue;
        }

        if (input[i] === '"') {
            if (inQuote) {
                currCommand.push(currToken);
                currToken = '';
                inQuote = false;
            } else {
                inQuote = true;
            }
            continue;
        }

        if (input[i] === '\\') {
            inEscape = true;
            continue;
        }

        if (!inQuote && input[i] === ';') {
            if (currToken.length) {
                currCommand.push(currToken);
                currToken = '';
            }
            prevCommands.push(currCommand);
            currCommand = [];
            continue;
        };

        currToken += input[i];
    }
    if (currToken.length) {
        currCommand.push(currToken);
    }
    prevCommands.push(currCommand);

    return prevCommands;
};
//NOTE: tests for the parser above
// import chalk from 'chalk';
// const testCommands = [
//     ' \x1B ONE_ARG_WITH_SPACE "part1 part2"',
//     'TWO_ARGS arg1 arg2',
//     'ONE_ARG_WITH_SPACE_SEMICOLON "arg mid;cut"',
//     'ESCAPED_QUOTE "aa\\"bb"',
//     'ESCAPED_ESCAPE "aa\\\\bb"',
//     'ESCAPED_X "aa\\xbb"',
//     // 'NO_CLOSING_QUOTE "aa',
//     // 'SHOW_AB_C aaa#bbb ccc',
//     // 'COMMENT //anything noshow',
//     'COMMENT #anything noshow',
//     'noshow2',
// ];
// const parsed = readLineCommands(testCommands.join(';'));
// for (const commandTokens of parsed) {
//     console.log(`${commandTokens[0]}:`);
//     commandTokens.slice(1).forEach((token) => {
//         console.log(chalk.inverse(token));
//     });
//     console.log('\n');
// }


/**
 * Recursively parse server.cfg files losely based on the fxserver original parser.
 * Notable differences: we have recursivity depth limit, and no json parsing
 * Original CFG (console) parser:
 *  fivem/code/client/citicore/console/Console.cpp > Context::ExecuteBuffer
 *
 * FIXME: support `@resource/whatever.cfg` syntax
 */
export const parseRecursiveConfig = async (
    cfgInputString: string | null, //cfg string, or null to load from file
    cfgAbsolutePath: string,
    serverDataPath: string,
    stack?: string[]
) => {
    if (typeof cfgInputString !== 'string' && cfgInputString !== null) {
        throw new Error('cfgInputString expected to be string or null');
    }

    // Ensure safe stack
    const MAX_DEPTH = 5;
    if (!Array.isArray(stack)) {
        stack = [];
    } else if (stack.length >= MAX_DEPTH) {
        throw new Error(`cfg 'exec' command depth above ${MAX_DEPTH}`);
    } else if (stack.includes(cfgAbsolutePath)) {
        throw new Error(`cfg cyclical 'exec' command detected to file ${cfgAbsolutePath}`); //should block
    }
    stack.push(cfgAbsolutePath);

    // Read raw config and split lines
    const cfgData = cfgInputString ?? await readRawCFGFile(cfgAbsolutePath);
    const cfgLines = cfgData.split('\n');

    // Parse CFG lines
    const parsedCommands: (Command|ExecRecursionError)[] = [];
    for (let i = 0; i < cfgLines.length; i++) {
        const lineString = cfgLines[i].trim();
        const lineNumber = i + 1;
        const lineCommands = readLineCommands(lineString);

        // For each command in that line
        for (const cmdTokens of lineCommands) {
            if (!cmdTokens.length) continue;
            const cmdObject = new Command(cmdTokens, cfgAbsolutePath, lineNumber);
            parsedCommands.push(cmdObject);

            // If exec command, process recursively then flatten the output
            if (cmdObject.command === 'exec' && typeof cmdObject.args[0] === 'string') {
                //FIXME: temporarily disable resoure references
                if(!cmdObject.args[0].startsWith('@')){
                    const recursiveCfgAbsolutePath = resolveCFGFilePath(cmdObject.args[0], serverDataPath);
                    try {
                        const extractedCommands = await parseRecursiveConfig(null, recursiveCfgAbsolutePath, serverDataPath, stack);
                        parsedCommands.push(...extractedCommands);
                    } catch (error) {
                        parsedCommands.push(new ExecRecursionError(cfgAbsolutePath, (error as Error).message, lineNumber));
                    }
                }
            }
        }
    }

    stack.pop();
    return parsedCommands;
};

type EndpointsObjectType = Record<string, { tcp?: true; udp?: true; }>

/**
 * Validates a list of parsed commands to return endpoints, errors, warnings and lines to comment out
 * @param {array} parsedCommands
 * @returns {object}
 */
const validateCommands = async (parsedCommands: (ExecRecursionError | Command)[]) => {
    const zapPrefix = (convars.isZapHosting) ? ' [ZAP-Hosting]' : '';
    const checkedInterfaces = new Map();

    //To return
    const endpoints: EndpointsObjectType = {};
    const errors = new FilesInfoList();
    const warnings = new FilesInfoList();
    const toCommentOut = new FilesInfoList();

    for (const cmd of parsedCommands) {
        //In case of error
        if (cmd instanceof ExecRecursionError) {
            warnings.add(cmd.file, cmd.line, cmd.message);
            continue;
        }

        //Check for +set
        if (['+set', '+setr', '+setr'].includes(cmd.command)) {
            const msg = `Line ${cmd.line}: remove the '+' from '${cmd.command}', as this is not an launch parameter.`;
            warnings.add(cmd.file, cmd.line, msg);
            continue;
        }

        //Check for start/stop/ensure txAdmin/txAdminClient/monitor
        if (
            ['start', 'stop', 'ensure'].includes(cmd.command)
            && cmd.args.length >= 1
            && ['txadmin', 'txadminclient', 'monitor'].includes(cmd.args[0].toLowerCase())
        ) {
            toCommentOut.add(
                cmd.file,
                cmd.line,
                'you MUST NOT start/stop/ensure txadmin resources.',
            );
            continue;
        }

        //Check sv_maxClients against ZAP config
        const isMaxClientsString = cmd.getSetForVariable('sv_maxclients');
        if (
            typeof convars.deployerDefaults === 'object'
            && convars.deployerDefaults?.maxClients
            && isMaxClientsString
        ) {
            const maxClients = parseInt(isMaxClientsString);
            if (maxClients > convars.deployerDefaults.maxClients) {
                warnings.add(
                    cmd.file,
                    cmd.line,
                    `${zapPrefix} your 'sv_maxclients' SHOULD be <= ${convars.deployerDefaults.maxClients}.`
                );
                continue;
            }
        }

        //Comment out any onesync sets
        if (cmd.getSetForVariable('onesync')) {
            toCommentOut.add(
                cmd.file,
                cmd.line,
                'onesync MUST only be set in the txAdmin settings page.',
            );
            continue;
        }

        //Extract & process endpoint validity
        if (cmd.command === 'endpoint_add_tcp' || cmd.command === 'endpoint_add_udp') {
            //Validating args length
            if (cmd.args.length !== 1) {
                warnings.add(
                    cmd.file,
                    cmd.line,
                    `the 'endpoint_add_*' commands MUST have exactly 1 argument (received ${cmd.args.length})`
                );
                continue;
            }

            //Extracting parts & validating format
            const endpointsRegex = /^\[?(([0-9.]{7,15})|([a-z0-9:]{2,29}))\]?:(\d{1,5})$/gi;
            const matches = [...cmd.args[0].matchAll(endpointsRegex)];
            if (!Array.isArray(matches) || !matches.length) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `the \`${cmd.args[0]}\` is not in a valid \`ip:port\` format.`
                );
                continue;
            }
            const [_matchedString, iface, ipv4, ipv6, portString] = matches[0];

            //Checking if that interface is available to binding
            let canBind = checkedInterfaces.get(iface);
            if (typeof canBind === 'undefined') {
                canBind = await isLocalhost(iface, true);
                checkedInterfaces.set(iface, canBind);
            }
            if (canBind === false) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `the '${cmd.command}' interface '${iface}' is not available for this host.`
                );
                continue;
            }
            if (convars.forceInterface && iface !== convars.forceInterface) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `${zapPrefix} the '${cmd.command}' interface MUST be '${convars.forceInterface}'.`
                );
                continue;
            }

            //Validating port
            const port = parseInt(portString);
            if (port >= 40120 && port <= 40150) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `the '${cmd.command}' port '${port}' is dedicated for txAdmin and CAN NOT be used for FXServer.`
                );
                continue;
            }
            if (port === convars.txAdminPort) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `the '${cmd.command}' port '${port}' is being used by txAdmin and CAN NOT be used for FXServer at the same time.`
                );
                continue;
            }
            if (convars.forceFXServerPort && port !== convars.forceFXServerPort) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `${zapPrefix} the '${cmd.command}' port MUST be '${convars.forceFXServerPort}'.`
                );
                continue;
            }

            //Add to the endpoint list and check duplicity
            const endpoint = (ipv4) ? `${ipv4}:${port}` : `[${ipv6}]:${port}`;
            const protocol = (cmd.command === 'endpoint_add_tcp') ? 'tcp' : 'udp';
            if (typeof endpoints[endpoint] === 'undefined') {
                endpoints[endpoint] = {};
            }
            if (endpoints[endpoint][protocol]) {
                errors.add(
                    cmd.file,
                    cmd.line,
                    `you CANNOT execute '${cmd.command}' twice for the interface '${endpoint}'.`
                );
                continue;
            } else {
                endpoints[endpoint][protocol] = true;
            }
        }
    }

    return { endpoints, errors, warnings, toCommentOut };
};


/**
 * Process endpoints object, checks validity, and then returns a connection string
 */
const getConnectEndpoint = (endpoints: EndpointsObjectType) => {
    if (!Object.keys(endpoints).length) {
        let msg;
        if (convars.forceInterface && convars.forceFXServerPort) {
            const desidredEndpoint = `${convars.forceInterface}:${convars.forceFXServerPort}`;
            msg = `Please delete all \`endpoint_add_*\` lines and add the following to the start of the file:
\t\`endpoint_add_tcp "${desidredEndpoint}"\`
\t\`endpoint_add_udp "${desidredEndpoint}"\``;
        } else {
            msg = `Your config file does not specify a valid endpoint for fxserver to use.
\tPlease delete all \`endpoint_add_*\` lines and add the following to the start of the file:
\t\`endpoint_add_tcp "0.0.0.0:30120"\`
\t\`endpoint_add_udp "0.0.0.0:30120"\``;
        }
        throw new Error(msg);
    }
    const tcpudpEndpoint = Object.keys(endpoints).find((ep) => {
        return endpoints[ep].tcp && endpoints[ep].udp;
    });
    if (!tcpudpEndpoint) {
        throw new Error('Your config file does not not contain a ip:port used in both `endpoint_add_tcp` and `endpoint_add_udp`. Players would not be able to connect.');
    }

    return tcpudpEndpoint.replace(/(0\.0\.0\.0|\[::\])/, '127.0.0.1');
};


/**
 * Validates & ensures correctness in fxserver config file recursively.
 * Used when trying to start server, or validate the server.cfg.
 * Returns errors, warnings and connectEndpoint
 */
export const validateFixServerConfig = async (cfgPath: string, serverDataPath: string) => {
    //Parsing fxserver config & going through each command
    const cfgAbsolutePath = resolveCFGFilePath(cfgPath, serverDataPath);
    const parsedCommands = await parseRecursiveConfig(null, cfgAbsolutePath, serverDataPath);
    const { endpoints, errors, warnings, toCommentOut } = await validateCommands(parsedCommands);

    //Validating if a valid endpoint was detected
    let connectEndpoint: string | false = false;
    try {
        connectEndpoint = getConnectEndpoint(endpoints);
    } catch (error) {
        errors.add(cfgAbsolutePath, false, (error as Error).message);
    }

    //Commenting out lines or registering them as warnings
    for (const targetCfgPath in toCommentOut.store) {
        const actions = toCommentOut.store[targetCfgPath];
        try {
            const cfgRaw = await fsp.readFile(targetCfgPath, 'utf8');

            //modify the cfg lines
            const fileEOL = detectNewline(cfgRaw);
            const cfgLines = cfgRaw.split(/\r?\n/);
            for (const [ln, reason] of actions) {
                if (ln === false) continue;
                if (typeof cfgLines[ln - 1] !== 'string') {
                    throw new Error(`Line ${ln} not found.`);
                }
                cfgLines[ln - 1] = `## [txAdmin CFG validator]: ${reason}${fileEOL}# ${cfgLines[ln - 1]}`;
                warnings.add(targetCfgPath, ln, `Commented out: ${reason}`);
            }

            //Saving modified lines
            const newCfg = cfgLines.join(fileEOL);
            console.warn(`Saving modified file '${targetCfgPath}'`);
            await fsp.writeFile(targetCfgPath, newCfg, 'utf8');
        } catch (error) {
            console.verbose.error(error);
            for (const [ln, reason] of actions) {
                errors.add(targetCfgPath, ln, `Please comment out this line: ${reason}`);
            }
        }
    }

    //Prepare response
    return {
        connectEndpoint,
        errors: errors.toMarkdown(),
        warnings: warnings.toMarkdown(),
        // errors: errors.store,
        // warnings: warnings.store,
        // endpoints, //Not being used
    };
};


/**
 * Validating config contents + saving file and backup.
 * In case of any errors, it does not save the contents.
 * Does not comment out (fix) bad lines.
 * Used whenever a user wants to modify server.cfg.
 * Returns if saved, and warnings
 */
export const validateModifyServerConfig = async (
    cfgInputString: string,
    cfgPath: string,
    serverDataPath: string
) => {
    if (typeof cfgInputString !== 'string') {
        throw new Error('cfgInputString expected to be string.');
    }

    //Parsing fxserver config & going through each command
    const cfgAbsolutePath = resolveCFGFilePath(cfgPath, serverDataPath);
    const parsedCommands = await parseRecursiveConfig(cfgInputString, cfgAbsolutePath, serverDataPath);
    const { endpoints, errors, warnings } = await validateCommands(parsedCommands);

    //Validating if a valid endpoint was detected
    try {
        const _connectEndpoint = getConnectEndpoint(endpoints);
    } catch (error) {
        errors.add(cfgAbsolutePath, false, (error as Error).message);
    }

    //If there are any errors
    if (errors.count()) {
        return {
            success: false,
            errors: errors.toMarkdown(),
            warnings: warnings.toMarkdown(),
        };
    }

    //Save file + backup
    try {
        console.warn(`Saving modified file '${cfgAbsolutePath}'`);
        await fsp.copyFile(cfgAbsolutePath, `${cfgAbsolutePath}.bkp`);
        await fsp.writeFile(cfgAbsolutePath, cfgInputString, 'utf8');
    } catch (error) {
        throw new Error(`Failed to edit 'server.cfg' with error: ${(error as Error).message}`);
    }

    return {
        success: true,
        warnings: warnings.toMarkdown(),
    };
};
/*
    fxrunner spawnServer:       recursive validate file, get endpoint
    settings handleFXServer:    recursive validate file
    setup handleValidateCFGFile:    recursive validate file
    setup handleSaveLocal:      recursive validate file

    cfgEditor CFGEditorSave:    validate string, save
    deployer handleSaveConfig:  validate string, save *
*/

/*

# Endpoints test cases:
/"\[?(([0-9.]{7,15})|([a-z0-9:]{2,29}))\]?:(\d{1,5})"/gmi

# default
"0.0.0.0:30120"
"[0.0.0.0]:30120"
"0.0.0.0"
"[0.0.0.0]"

# ipv6/ipv4
"[::]:30120"
":::30120"
"[::]"

# ipv6 only
"fe80::4cec:1264:187e:ce2b:30120"
"[fe80::4cec:1264:187e:ce2b]:30120"
"::1:30120"
"[::1]:30120"
"[fe80::4cec:1264:187e:ce2b]"
"::1"
"[::1]"

# fxserver doesn't accept
"::1.30120"
"::1 port 30120"
"::1p30120"
"::1#30120"
"::"

# fxserver misreads last part as a port
"fe80::4cec:1264:187e:ce2b"

*/
