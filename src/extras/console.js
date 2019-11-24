const ac = require('ansi-colors');
ac.enabled = require('color-support').hasBasic;
const header = 'txAdmin';
let logHistory = [];

//Helpers
const now = () => { return Math.round(new Date() / 1000) };
const getConCtx = (ctx) => { return (ctx !== null)? header+':'+ctx : header };
const getHistCtx = (ctx) => { return (ctx !== null)? ctx : header };
const toHistory = (type, ctx, msg) =>{
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
    console.dir(data);
}

function getLog(){
    return logHistory;
}

//================================================================
module.exports = {
    log,
    logOk,
    logWarn,
    logError,
    cleanTerminal,
    setTTYTitle,
    dir,
    getLog,
}
