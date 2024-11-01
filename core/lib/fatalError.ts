
import chalk from "chalk";
import consoleFactory from "./console";
const console = consoleFactory();


const padStartEnd = (str: string): string => {
    str = ` ${str} `;
    const padStart = Math.ceil((console.DIVIDER_SIZE + str.length) / 2);
    return str.padStart(padStart, '-').padEnd(console.DIVIDER_SIZE, '-');
}

type ErrorMsgType = string | string[];
function fatalError(code: number, msg: ErrorMsgType, err?: any): never {
    console.error(console.DIVIDER);
    console.error(chalk.inverse(
        padStartEnd(`FATAL ERROR: E${code}`)
    ));
    console.error(console.DIVIDER);
    if (Array.isArray(msg)) {
        for (const line of msg) {
            console.error(line);
        }
    } else {
        console.error(msg);
    }
    if (err) console.dir(err);
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
100 - global data
200 - boot
    202 - txdata
    203 - setup profile throw
    204 - setup profile mkdir/writefile
    210 - expired
    211 - expired cron
    220 - configvault throw
    221 - modules constructor throw
    222 - global placeholder
5100 - config vault
5300 - admin vault
5400 - fxrunner
5600 - database
5700 - stats txruntime
5800 - webserver
*/

fatalError.GlobalData = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(100 + code, msg, err);
fatalError.Boot = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(200 + code, msg, err);

fatalError.ConfigVault = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5100 + code, msg, err);
fatalError.Translator = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5200 + code, msg, err);
fatalError.AdminVault = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5300 + code, msg, err);
// fatalError.FxRunner = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5400 + code, msg, err);
fatalError.Database = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5600 + code, msg, err);
fatalError.StatsTxRuntime = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5700 + code, msg, err);
fatalError.WebServer = (code: number, msg: ErrorMsgType, err?: any): never => fatalError(5800 + code, msg, err);

export default fatalError;
