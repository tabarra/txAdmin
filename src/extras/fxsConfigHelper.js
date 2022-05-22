const fsp = require('node:fs/promises');
const path = require('node:path');
const { parseArgsStringToArgv } = require('string-argv');

//DEBUG
const { dir, log, logOk, logWarn, logError } = require('./console')();


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
    forEach(func) {
        for (const file of Object.keys(this.store)) {
            func(file, this.store[file]);
        }
    }
}


/**
 * Validates & ensures correctness in fxserver config file recursively.
 * TODO: write here what this does
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

    const endpointCommands = [];
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
            if(maxClients > GlobalData.deployerDefaults.maxClients){
                const msg = `Line ${cmd.line}: [ZAP-Hosting] your 'sv_maxclients' SHOULD be <= ${GlobalData.deployerDefaults.maxClients}.`;
                warnings.add(cmd.file, msg);
                continue;
            }
        }

        //Comment out any onesync sets
        if (cmd.getSetForVariable('onesync')) {
            toCommentOut.add(
                cmd.file,
                [cmd.line, 'onesync should only be set in the txAdmin settings page.']
            );
            continue;
        }

        //Extract & process endpoint validity
        //     if invalid bind endpoint, send error
    }

    //TODO: process endpoints
    //  if validation fails, send error
    //  old:
    //  - no endpoints found
    //  - endpoints that are not 0.0.0.0:xxx
    //  - port mismatch
    //  - "stop/start/ensure/restart txAdmin/monitor"
    //  - if endpoint on txAdmin port
    //  - if endpoint on 40120~40130
    //  - zap-hosting iface and port enforcement

    //FIXME: when trying to fix: success move to warning, fail move to error

    // return parsedCommands;
    return {
        preferredEndpoint: 'xx.xx.xx.xx:yyyy',
        errors, //unlike warning, erros should block the server start
        warnings,
        toCommentOut, //DEBUG: remover
    };


    //FIXME: se tiver cfgInputString ou se tiver alguma correção, salvar arquivo(s)


    return {
        preferredEndpoint: 'xx.xx.xx.xx:yyyy',
        errors: {}, //unlike warning, erros should block the server start
        warnings: {
            "E:\\FiveM\\BUILDS\\txData\\jun2020.base\\server.cfg": [
                'Line 23: Automatically commented out like because the "onesync" variable should be set in txadmin settings.',
                'Line 45: Automatically setting "sv_maxClients" back to 32 due to ZAP-Hosting configuration.',
            ],
        },
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
