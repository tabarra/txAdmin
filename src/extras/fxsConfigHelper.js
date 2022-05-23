const fsp = require('node:fs/promises');
const path = require('node:path');
const { EOL } = require('os');
const isLocalhost = require('is-localhost-ip');

//DEBUG
const { dir, log, logOk, logWarn, logError } = require('./console')();

/**
 * Detect the dominant newline character of a string.
 * Extracted from https://www.npmjs.com/package/detect-newline
 * @param {*} string 
 * @returns 
 */
const detectNewline = (string) => {
    if (typeof string !== 'string') {
        throw new TypeError('Expected a string');
    }

    const newlines = string.match(/(?:\r?\n)/g) || [];

    if (newlines.length === 0) {
        return;
    }

    const crlf = newlines.filter(newline => newline === '\r\n').length;
    const lf = newlines.length - crlf;

    return crlf > lf ? '\r\n' : '\n';
}


/**
 * Helper function to store commands
 */
class Command {
    constructor(tokens, filePath, fileLine) {
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
    getSetForVariable(varname) {
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
    constructor(file, message) {
        this.file = file;
        this.message = message;
    }
}

/**
 * Helper class to store file TODOs, errors and warnings
 */
class FileInfoList {
    constructor() {
        this.store = {}
    }
    add(file, info) {
        if (Array.isArray(this.store[file])) {
            this.store[file].push(info)
        } else {
            this.store[file] = [info];
        }
    }
    toJSON() {
        return this.store;
    }
}


/**
 * Returns the absolute path of the given CFG Path
 * @param {string} cfgPath
 * @param {string} serverDataPath
 * @returns {string} cfg file absolute path
 */
const resolveCFGFilePath = (cfgPath, serverDataPath) => {
    return (path.isAbsolute(cfgPath)) ? path.normalize(cfgPath) : path.resolve(serverDataPath, cfgPath);
};


/**
 * Reads CFG Path and return the file contents, or throw error if:
 *  - the path is not valid (must be absolute)
 *  - cannot read the file data
 * @param {string} cfgFullPath
 * @returns {string} raw cfg file
 */
const readRawCFGFile = async (cfgPath) => {
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
 * @param {string} input
 * @returns {array} array of commands
 */
const readLineCommands = (input) => {
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
// const chalk = require('chalk');
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
 * 
 * @param {string|null} cfgInputString the cfg string to validate before saving, or null to load from file
 * @param {string} cfgPath
 * @param {string} serverDataPath
 * @param {array} stack
 * @returns {object} recursive cfg structure
 */
const parseRecursiveConfig = async (cfgInputString, cfgAbsolutePath, serverDataPath, stack) => {
    if (typeof cfgInputString !== 'string' && cfgInputString !== null) {
        throw new Error('cfgInputString expected to be string or null');
    }

    // Ensure safe stack
    const MAX_DEPTH = 5;
    if (!Array.isArray(stack)) {
        stack = [];
    } else if (stack.length > MAX_DEPTH) {
        throw new Error(`cfg 'exec' command depth above ${MAX_DEPTH}`);
    } else if (stack.includes(cfgAbsolutePath)) {
        throw new Error(`cfg cyclical 'exec' command detected to file ${cfgAbsolutePath}`);
    }
    stack.push(cfgAbsolutePath);

    // Read raw config and split lines
    const cfgData = cfgInputString ?? await readRawCFGFile(cfgAbsolutePath);
    const cfgLines = cfgData.split('\n');

    // Parse CFG lines
    const parsedCommands = [];
    for (let i = 0; i < cfgLines.length; i++) {
        const lineString = cfgLines[i].trim();
        const lineNumber = i + 1;
        const lineCommands = readLineCommands(lineString);

        // For each command in that line
        for (const cmdTokens of lineCommands) {
            if (!cmdTokens.length) {
                continue;
            }
            const cmdObject = new Command(cmdTokens, cfgAbsolutePath, lineNumber);
            parsedCommands.push(cmdObject);

            // If exec command, process recursively then flatten the output
            if (cmdObject.command === 'exec') {
                const recursiveCfgAbsolutePath = resolveCFGFilePath(cmdObject.args[0], serverDataPath);
                try {
                    const extractedCommands = await parseRecursiveConfig(null, recursiveCfgAbsolutePath, serverDataPath, stack);
                    parsedCommands.push(...extractedCommands);
                } catch (error) {
                    const msg = `Line ${lineNumber}: ${error.message}`;
                    parsedCommands.push(new ExecRecursionError(cfgAbsolutePath, msg));
                }
            }
        }
    }

    return parsedCommands;
};


/**
 * Validates a list of parsed commands to return endpoints, errors, warnings and lines to comment out
 * @param {array} parsedCommands 
 * @returns {object}
 */
const validateCommands = async (parsedCommands) => {
    const zapPrefix = (GlobalData.isZapHosting) ? ' [ZAP-Hosting]' : '';
    const checkedInterfaces = new Map();

    //To return
    const endpoints = {};
    const errors = new FileInfoList();
    const warnings = new FileInfoList();
    const toCommentOut = new FileInfoList();

    for (const cmd of parsedCommands) {
        //In case of error
        if (cmd instanceof ExecRecursionError) {
            warnings.add(cmd.file, cmd.message);
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
                [cmd.line, 'you MUST NOT start/stop/ensure txadmin resources.']
            );
            continue;
        }

        //Check sv_maxClients against ZAP config
        const isMaxClientsString = cmd.getSetForVariable('sv_maxclients');
        if (GlobalData.deployerDefaults?.maxClients && isMaxClientsString) {
            const maxClients = parseInt(isMaxClientsString);
            if (maxClients > GlobalData.deployerDefaults.maxClients) {
                const msg = `Line ${cmd.line}:${zapPrefix} your 'sv_maxclients' SHOULD be <= ${GlobalData.deployerDefaults.maxClients}.`;
                warnings.add(cmd.file, msg);
                continue;
            }
        }

        //Comment out any onesync sets
        if (cmd.getSetForVariable('onesync')) {
            toCommentOut.add(
                cmd.file,
                [cmd.line, 'onesync MUST only be set in the txAdmin settings page.']
            );
            continue;
        }

        //Extract & process endpoint validity
        if (cmd.command === 'endpoint_add_tcp' || cmd.command === 'endpoint_add_udp') {
            //Validating args length
            if (cmd.args.length !== 1) {
                const msg = `Line ${cmd.line}: the 'endpoint_add_*' commands MUST have exactly 1 argument (received ${cmd.args.length})`;
                warnings.add(cmd.file, msg);
                continue;
            }

            //Extracting parts & validating format
            const endpointsRegex = /^\[?(([0-9.]{7,15})|([a-z0-9:]{2,29}))\]?:(\d{1,5})$/gi;
            const matches = [...cmd.args[0].matchAll(endpointsRegex)];
            if (!Array.isArray(matches) || !matches.length) {
                const msg = `Line ${cmd.line}: the '${cmd.command}' interface:port '${cmd.args[0]}' is not in a valid format.`;
                errors.add(cmd.file, msg);
                continue;
            }
            const [matchedString, interface, ipv4, ipv6, portString] = matches[0];

            //Checking if that interface is available to binding
            let canBind = checkedInterfaces.get(interface);
            if (typeof canBind === 'undefined') {
                canBind = await isLocalhost(interface, true);
                checkedInterfaces.set(interface, canBind);
            }
            if (canBind === false) {
                const msg = `Line ${cmd.line}: the '${cmd.command}' interface '${interface}' is not available for this host.`;
                errors.add(cmd.file, msg);
                continue;
            }
            if (GlobalData.forceInterface && interface !== GlobalData.forceInterface) {
                const msg = `Line ${cmd.line}:${zapPrefix} the '${cmd.command}' interface MUST be '${GlobalData.forceInterface}'.`;
                errors.add(cmd.file, msg);
                continue;
            }

            //Validating port
            const port = parseInt(portString);
            if (port >= 40120 && port <= 40150) {
                const msg = `Line ${cmd.line}: the '${cmd.command}' port '${port}' is dedicated for txAdmin and CAN NOT be used for FXServer.`;
                errors.add(cmd.file, msg);
                continue;
            }
            if (port === GlobalData.txAdminPort) {
                const msg = `Line ${cmd.line}: the '${cmd.command}' port '${port}' is being used by txAdmin and CAN NOT be used for FXServer at the same time.`;
                errors.add(cmd.file, msg);
                continue;
            }
            if (GlobalData.forceFXServerPort && port !== GlobalData.forceFXServerPort) {
                const msg = `Line ${cmd.line}:${zapPrefix} the '${cmd.command}' port MUST be '${GlobalData.forceFXServerPort}'.`;
                errors.add(cmd.file, msg);
                continue;
            }

            //Add to the endpoint list and check duplicity
            const endpoint = (ipv4) ? `${ipv4}:${port}` : `[${ipv6}]:${port}`;
            const protocol = (cmd.command === 'endpoint_add_tcp') ? 'tcp' : 'udp';
            if (typeof endpoints[endpoint] === 'undefined') {
                endpoints[endpoint] = {}
            }
            if (endpoints[endpoint][protocol]) {
                const msg = `Line ${cmd.line}: you CANNOT execute '${cmd.command}' twice for the interface '${endpoint}'.`;
                errors.add(cmd.file, msg);
                continue;
            } else {
                endpoints[endpoint][protocol] = true;
            }
        }
    }

    return { endpoints, errors, warnings, toCommentOut }
}


/**
 * Validates & ensures correctness in fxserver config file recursively.
 *
 * @param {string|null} cfgInputString the cfg string to validate before saving, or null to load from file
 * @param {string} cfgPath
 * @param {string} serverDataPath
 * @returns {object} recursive cfg structure
 */
const ensureSaveServerConfig = async (cfgInputString, cfgPath, serverDataPath) => {
    if (typeof cfgInputString !== 'string' && cfgInputString !== null) {
        throw new Error('cfgInputString expected to be string or null');
    }

    //Parsing fxserver config & going through each command
    const cfgAbsolutePath = resolveCFGFilePath(cfgPath, serverDataPath);
    const parsedCommands = await parseRecursiveConfig(cfgInputString, cfgAbsolutePath, serverDataPath);
    const { endpoints, errors, warnings, toCommentOut } = await validateCommands(parsedCommands);

    //Validating if a valid endpoint was detected
    if (!Object.keys(endpoints).length) {
        const msg = `Your config file does not specify which IP and port fxserver should run. You can fix this by adding 'endpoint_add_tcp 0.0.0.0:30120; endpoint_add_udp 0.0.0.0:30120' to the start of the file.`;
        errors.add(cfgAbsolutePath, msg);
    }
    let connectEndpoint = false;
    const tcpudpEndpoint = Object.keys(endpoints).find((ep) => {
        return endpoints[ep].tcp && endpoints[ep].udp;
    });
    if (tcpudpEndpoint) {
        connectEndpoint = tcpudpEndpoint.replace(/(0\.0\.0\.0|\[::\])/, '127.0.0.1');
    } else {
        const msg = `Your config file does not not contain a ip:port used in both endpoint_add_tcp and endpoint_add_udp. Players would not be able to connect.`;
        errors.add(cfgAbsolutePath, msg);
    }

    //Commenting out lines or registering them as warnings
    let wasEntrypointModified = false;
    for (const targetCfgPath in toCommentOut.store) {
        const actions = toCommentOut.store[targetCfgPath];
        try {
            //If cfgInputString was provided and this action applies to the entry point file, use the cfgInputString instead of reading the file
            if (cfgInputString && targetCfgPath === cfgAbsolutePath) {
                wasEntrypointModified = true;
                cfgRaw = cfgInputString;
            } else {
                cfgRaw = await fsp.readFile(targetCfgPath, 'utf8');
            }

            //modify the cfg lines
            const fileEOL = detectNewline(cfgRaw);
            const cfgLines = cfgRaw.split(/\r?\n/);
            for (const [ln, reason] of actions) {
                if (typeof cfgLines[ln - 1] !== 'string') {
                    throw new Error(`Line ${ln} not found.`);
                }
                cfgLines[ln - 1] = `## [txAdmin CFG validator]: ${reason}${fileEOL}# ${cfgLines[ln - 1]}`;
                warnings.add(targetCfgPath, `Commented out line ${ln}: ${reason}`);
            }

            //Saving modified lines
            const newCfg = cfgLines.join(fileEOL);
            logWarn(`Saving modified file '${targetCfgPath}'`);
            await fsp.writeFile(targetCfgPath, newCfg, 'utf8');
        } catch (error) {
            if (GlobalData.verbose) logError(error);
            for (const [ln, reason] of actions) {
                errors.add(targetCfgPath, `Please comment out line ${ln}: ${reason}`);
            }
        }
    }

    //If cfgInputString was provided and not modified yet, save file
    if (cfgInputString && !wasEntrypointModified) {
        logWarn(`Saving modified file '${cfgAbsolutePath}'`);
        await fsp.writeFile(cfgAbsolutePath, cfgInputString, 'utf8');
    }

    //unlike warning, erros should block the server start
    return {
        connectEndpoint,
        errors: Object.entries(errors.store),
        warnings: Object.entries(warnings.store),
        // endpoints, //Not being used
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


module.exports = {
    resolveCFGFilePath,
    readRawCFGFile,
    readLineCommands,
    parseRecursiveConfig,
    ensureSaveServerConfig,
};

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
