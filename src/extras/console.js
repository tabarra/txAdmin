const ac = require('ansi-colors');
ac.enabled = true;
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


//================================================================
function log(msg, context=null){
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(ac.bold.bgBlue(`[${conCtx}]`)+' '+msg);
    toHistory('INFO', histCtx, msg);
    return `[INFO][${conCtx}] ${msg}`;
}

function logOk(msg, context=null){
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(ac.bold.bgGreen(`[${conCtx}]`)+' '+msg);
    toHistory('OK', histCtx, msg);
    return `[OK][${conCtx}] ${msg}`;
}

function logWarn(msg, context=null) {
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(ac.bold.bgYellow(`[${conCtx}]`)+' '+msg);
    toHistory('WARN', histCtx, msg);
    return `[WARN][${conCtx}] ${msg}`;
}

function logError(msg, context=null) {
    let conCtx = getConCtx(context);
    let histCtx = getHistCtx(context);
    console.log(ac.bold.bgRed(`[${conCtx}]`)+' '+msg);
    toHistory('ERROR', histCtx, msg);
    return `[ERROR][${conCtx}] ${msg}`;
}

function cleanTerminal(){
    process.stdout.write(`.\n`.repeat(80) + `\x1B[2J\x1B[H`);
}

function setTTYTitle(title){
    title = (title)? `txAdmin: ${title}` : 'txAdmin';
    process.stdout.write(`\x1B]0;${title}\x07`);
}

function dir(data){
    if(data instanceof Error){
        try {
            console.log(`${ac.redBright('[txAdmin Error]')} ${data.message}`);
            if(typeof data.type !== 'undefined') console.log(`${ac.redBright('[txAdmin Error] Type:')} ${data.type}`);
            if(typeof data.code !== 'undefined') console.log(`${ac.redBright('[txAdmin Error] Code:')} ${data.code}`);
            data.stack.forEach(trace => {
                console.log(`    ${ac.redBright('=>')} ${trace.file}:${trace.line} > ${ac.yellowBright(trace.name || 'anonym')}`)
            });
        } catch (error) {
            console.log('Error stack unavailable.')
        }
        console.log()
    }else{
        let div = "=".repeat(32);
        let printData = (typeof data !== 'undefined')? JSON.stringify(data, null, 2) : 'undefined';
        console.log(ac.cyan([div, printData, div].join("\n")));
    }
}

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
