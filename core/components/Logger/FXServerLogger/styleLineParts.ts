import chalk, { ChalkInstance } from "chalk";
import { FxsConsoleMessageType } from ".";
import { FlushQueueBlockType } from "./ConsoleStreamAssembler";


const getConsoleLinePrefix = (prefix: string) => `[${prefix.padStart(20, ' ')}] `;
const consoleSystemPrefix = getConsoleLinePrefix('TXADMIN');
const consoleStderrPrefix = getConsoleLinePrefix('STDERR');

type StyledPart = {
    web: string; 
    stdout: string;
    file: string;
};


export default (part: FlushQueueBlockType): StyledPart => {
    // let prefixColor: ChalkInstance;
    let lineColor: ChalkInstance;
    if (type === FxsConsoleMessageType.StdErr) {
        lineColor = chalk.bgRedBright.bold.black;
        if (prefix) {
            // prefix = chalk.inverse(prefix);
            prefix = lineColor(prefix);
        }
    } else if (type === FxsConsoleMessageType.MarkerAdminCmd) {
        lineColor = chalk.bgYellowBright.bold.black;
    } else if (type === FxsConsoleMessageType.MarkerSystemCmd) {
        prefix = consoleSystemPrefix;
        //FIXME:
        lineColor = chalk.bgHex('#36383D').hex('#CCCCCC');
        // prefixColor = chalk.bgHex('#FF00DC').bold;
        if (prefix) {
            // prefix = chalk.inverse(prefix);
            prefix = chalk.bgHex('#FF00DC').bold(prefix);
        }
    } else if (type === FxsConsoleMessageType.MarkerInfo) {
        lineColor = chalk.bgBlueBright.bold.black;
    } else {
        // prefixColor = chalk.reset;
        lineColor = chalk.reset;
    }
    const finalEol = msg.endsWith('\n') ? '\n' : '';
    if (prefix) {
        return lineColor(msg.trim()).replace(/\n/g, `\n${prefix}`) + finalEol;
    } else {
        return lineColor(msg.trim()) + finalEol;
    }
    // if (prefix) {
    //     msg = prefix + msg.trim().replace(/\n/g, `\n${prefix}`) + finalEol;
    // }
    // return lineColor(msg.trim()) + finalEol;
};
