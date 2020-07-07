const chalk = require('chalk');
const colorize = require('json-colorizer');
const header = 'txAdmin';
let logHistory = [];

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };
const getConCtx = (ctx) => { return (ctx !== null)? header+':'+ctx : header };
const getHistCtx = (ctx) => { return (ctx !== null)? ctx : header };
const toHistory = (type, ctx, msg) =>{
    msg = msg.replace(/\u001b\[\d+(;\d)?m/g, '');
    if(logHistory.length > 4000){
        let sliceMsg = {ts: now(), type: 'ERROR', ctx: 'ConsoleLog', msg: 'The log was sliced to prevent memory exhaustion.'};
        logHistory = logHistory.slice(0,500).concat(sliceMsg, logHistory.slice(-500))
    }
    return logHistory.push({ts: now(), type, ctx, msg});
}

//Colorize settings:
const colorizeSettings = {
    pretty: true,
    colors: {
        BRACE: 'white',
        BRACKET: 'white',
        COLON: 'white',
        COMMA: 'white',
        STRING_KEY: '#FF450',
        STRING_LITERAL: 'cyan',
        NUMBER_LITERAL: 'green',
        BOOLEAN_LITERAL: 'blue',
        NULL_LITERAL: 'white',
    }
}


//================================================================
function log(msg='', context=null){
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(chalk.bold.bgBlue(`[${conCtx}]`)+' '+msg);
    toHistory('INFO', histCtx, msg);
    return `[INFO][${conCtx}] ${msg}`;
}

function logOk(msg='', context=null){
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(chalk.bold.bgGreen(`[${conCtx}]`)+' '+msg);
    toHistory('OK', histCtx, msg);
    return `[OK][${conCtx}] ${msg}`;
}

function logWarn(msg='', context=null) {
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(chalk.bold.bgYellow(`[${conCtx}]`)+' '+msg);
    toHistory('WARN', histCtx, msg);
    return `[WARN][${conCtx}] ${msg}`;
}

function logError(msg='', context=null) {
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(chalk.bold.bgRed(`[${conCtx}]`)+' '+msg);
    toHistory('ERROR', histCtx, msg);
    return `[ERROR][${conCtx}] ${msg}`;
}

function cleanTerminal(){
    process.stdout.write(`.\n`.repeat(80) + `\x1B[2J\x1B[H`);
}

function setTTYTitle(version, title){
    title = (title)? `txAdmin v${version}: ${title}` : 'txAdmin';
    process.stdout.write(`\x1B]0;${title}\x07`);
}

function dir(data){
    if(data instanceof Error){
        try {
            console.log(`${chalk.redBright('[txAdmin Error]')} ${data.message}`);
            if(typeof data.type !== 'undefined') console.log(`${chalk.redBright('[txAdmin Error] Type:')} ${data.type}`);
            if(typeof data.code !== 'undefined') console.log(`${chalk.redBright('[txAdmin Error] Code:')} ${data.code}`);
            data.stack.forEach(trace => {
                console.log(`    ${chalk.redBright('=>')} ${trace.file}:${trace.line} > ${chalk.yellowBright(trace.name || 'anonym')}`)
            });
        } catch (error) {
            console.log('Error stack unavailable.')
        }
        console.log()
    }else{
        let printData;
        if(typeof data == 'undefined'){
            printData = chalk.keyword('moccasin').italic('> undefined');

        }else if(data instanceof Promise){
            printData = chalk.keyword('moccasin').italic('> Promise');

        }else if(typeof data == 'boolean'){
            if(data){
                printData = chalk.keyword('lawngreen')('true');
            }else{
                printData = chalk.keyword('orangered')('false');
            }

        }else if(typeof data == 'object'){
            if(
                !Object.keys(data).length && 
                typeof data.toString == 'function' &&
                data.constructor.name &&
                data.constructor.name !== 'Object'
            ){
                printData = chalk.keyword('moccasin').italic(`> ${data.constructor.name}.toString():\n`);
                printData += chalk.white(data.toString());
            }else{
                // DEBUG when I really need it... (copypasted from stackoverflow)
                // const getCircularReplacer = () => {
                //     const seen = new WeakSet();
                //     return (key, value) => {
                //       if (typeof value === "object" && value !== null) {
                //         if (seen.has(value)) {
                //           return;
                //         }
                //         seen.add(value);
                //       }
                //       return value;
                //     };
                //   };
                // printData = JSON.stringify(data, getCircularReplacer(), 2);
                printData = colorize(data, colorizeSettings);
            }

        }else{
            printData = chalk.keyword('orange').italic(typeof data + ': ');
            if(typeof data == 'string'){
                printData += `"${data}"`;
    
            }else if(typeof data == 'number'){
                printData += chalk.green(data);
    
            }else if(typeof data == 'function'){
                printData += "\n";
                printData += data.toString();

            }else{
                printData = JSON.stringify(data, null, 2);
            }
        }
        const div = "=".repeat(32);
        console.log(chalk.cyan([div, printData, div].join("\n")));
    }
}

/*
// NOTE: test calls:
    dir(a => {return a.toUpperCase;})
    dir('sdfsdfdsf')
    dir(['aaa', 124])
    dir(123)
    dir(true)
    dir(false)
    dir({aaa: 'bbbb'})
    dir({})
    dir(/xx/)
    dir({}.uuuu)
    dir(new Promise((resolve, reject) => {
        resolve('aaaa')
    }))
    dir(new Error('hueeee'))
*/

function getLog(){
    return logHistory;
}

//================================================================
module.exports = (ctx) => {
    const appendSubCtx = (sub) => {return (sub !== null)? `${ctx}:${sub}` : ctx};
    return {
        log: (x, subCtx = null) => log(x, appendSubCtx(subCtx)),
        logOk: (x, subCtx = null) => logOk(x, appendSubCtx(subCtx)),
        logWarn: (x, subCtx = null) => logWarn(x, appendSubCtx(subCtx)),
        logError: (x, subCtx = null) => logError(x, appendSubCtx(subCtx)),
        dir: (x, subCtx = null) => dir(x, appendSubCtx(subCtx)),
        cleanTerminal,
        setTTYTitle,
        getLog
    }
}
