const fsp = require('node:fs/promises');
const path = require('node:path');
const { parseArgsStringToArgv } = require('string-argv');


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


class Command {
    constructor(tokens, filePath, fileLine) {
        if (!Array.isArray(tokens) || tokens.length < 1) {
            throw new Error('Invalid command format');
        }
        this.command = tokens[0];
        this.args = tokens.slice(1);
        this.file = filePath;
        this.line = fileLine;
    }
}

class ExecRecursionError {
    constructor(cfgPath, message) {
        this.cfgPath = cfgPath;
        this.message = message;
    }
}


/**
 * Recursively parse server.cfg files losely based on the fxserver original parser.
 * Notable differences: we have recursivity depth limit, and no json parsing
 * Original CFG (console) parser:
 *  fivem/code/client/citicore/console/Console.cpp > Context::ExecuteBuffer
 * @param {string} cfgPath
 * @param {string} serverDataPath
 * @param {array} stack
 * @returns {object} recursive cfg structure
 */
const parseRecursiveConfig = async (cfgPath, serverDataPath, stack) => {
    // Get absolute path & ensure safe stack
    const cfgAbsolutePath = resolveCFGFilePath(cfgPath, serverDataPath);
    const MAX_DEPTH = 5;
    if (!Array.isArray(stack)) {
        stack = [];
    } else if (stack.length > MAX_DEPTH) {
        throw new Error(`cfg \'exec\' command depth above ${MAX_DEPTH}`);
    } else if (stack.includes(cfgAbsolutePath)) {
        throw new Error('cfg cyclical \'exec\' command detected ' + cfgAbsolutePath);
    }
    stack.push(cfgAbsolutePath);

    // Read raw config and split lines
    const cfgData = await readRawCFGFile(cfgAbsolutePath);
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
                try {
                    const extractedCommands = await parseRecursiveConfig(cmdObject.args[0], serverDataPath, stack);
                    parsedCommands.push(...extractedCommands);
                } catch (error) {
                    parsedCommands.push(new ExecRecursionError(cmdObject.args[0], error.message));
                }
            }
        }
    }

    return parsedCommands;
};

/*
    Validator:
        const endpoints = ??
        const errors = {};
        for each command
            - if start/stop/ensure + monitor
                ou comentar, ou errors[cmd.file] = [cmd.line, 'some message']
            - sv_maxClients
                ou arrumar, ou ignorar uma vez que o monitor corrige isso
            - onesync
                ou comentar ou ignorar
            - if endpoint
                ???
        validar endpoints somehow
*/

module.exports = {
    resolveCFGFilePath,
    readRawCFGFile,
    readLineCommands,
    parseRecursiveConfig,
};
