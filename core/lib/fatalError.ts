
import chalk from "chalk";
import consoleFactory from "./console";
const console = consoleFactory();

type ErrorLineSkipType = null | undefined | false;
type ErrorLineType = string | [desc: string, value: string] | ErrorLineSkipType;
type ErrorMsgType = ErrorLineType | ErrorLineType[];

const padStartEnd = (str: string): string => {
    str = ` ${str} `;
    const padStart = Math.ceil((console.DIVIDER_SIZE + str.length) / 2);
    return str.padStart(padStart, '-').padEnd(console.DIVIDER_SIZE, '-');
}

const printSingleLine = (line: ErrorLineType): void => {
    if (Array.isArray(line)) {
        if (line.length === 2 && typeof line[0] === 'string' && typeof line[1] === 'string') {
            console.error(`${line[0]}: ${chalk.dim(line[1])}`);
        } else {
            console.error(JSON.stringify(line));
        }
    } else if (typeof line === 'string') {
        console.error(line);
    }
}

function fatalError(code: number, msg: ErrorMsgType, err?: any): never {
    console.error(console.DIVIDER);
    console.error(chalk.inverse(
        padStartEnd(`FATAL ERROR: E${code}`)
    ));
    console.error(console.DIVIDER);
    if (Array.isArray(msg)) {
        for (const line of msg) {
            printSingleLine(line);
        }
    } else {
        printSingleLine(msg);
    }
    if (err) {
        console.error('-'.repeat(console.DIVIDER_SIZE));
        console.dir(err, { multilineError: true });
    }
    console.error(console.DIVIDER);
    console.error(chalk.inverse(
        padStartEnd('For support: https://discord.gg/txAdmin')
    ));
    console.error(console.DIVIDER);

    //Hacky solution to guarantee the error is flushed 
    //before fxserver double prints the exit code
    process.stdout.write('\n');
    process.stdout.write('\n');
    process.stdout.write('\n');
    process.stdout.write('\n');
    //This will make the process hang for 100ms before exiting
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    process.exit(code);
}


/*
NOTE: Going above 1000 to avoid collision with default nodejs error codes
ref: https://nodejs.org/docs/latest-v22.x/api/process.html#exit-codes

1000 - global data
2000 - boot
    2001 - txdata
    2002 - setup profile throw
    2003 - boot throw
    2010 - expired
    2011 - expired cron
    2022 - txCore placeholder getter error
    2023 - txCore placeholder setter error

5100 - config store
5300 - admin store
5400 - fxrunner
5600 - database
5700 - stats txruntime
5800 - webserver
*/


fatalError.GlobalData = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(1000 + code, msg, err);
fatalError.Boot = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(2000 + code, msg, err);

fatalError.ConfigStore = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5100 + code, msg, err);
fatalError.Translator = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5200 + code, msg, err);
fatalError.AdminStore = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5300 + code, msg, err);
// fatalError.FxRunner = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5400 + code, msg, err);
fatalError.Database = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5600 + code, msg, err);
fatalError.StatsTxRuntime = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5700 + code, msg, err);
fatalError.WebServer = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5800 + code, msg, err);

export default fatalError;
