const ac = require('ansi-colors');
ac.enabled = require('color-support').hasBasic;
const header = 'txAdmin';
let logHistory = [];

//Helpers
const now = () => { return Math.round(new Date() / 1000) };
const getCtx = (ctx) => { return (ctx !== null)? header+':'+ctx : header };


//================================================================
function log(msg, context=null){
    let ctx = getCtx(context);
    console.log(ac.bold.bgBlue(`[${ctx}]`)+' '+msg);
    logHistory.push({ts: now(), type: 'INFO', ctx: context, msg});
    return `[INFO][${ctx}] ${msg}`;
}

function logOk(msg, context=null){
    let ctx = getCtx(context);
    console.log(ac.bold.bgGreen(`[${ctx}]`)+' '+msg);
    logHistory.push({ts: now(), type: 'OK', ctx: context, msg});
    return `[OK][${ctx}] ${msg}`;
}

function logWarn(msg, context=null) {
    let ctx = getCtx(context);
    console.log(ac.bold.bgYellow(`[${ctx}]`)+' '+msg);
    logHistory.push({ts: now(), type: 'WARN', ctx: context, msg});
    return `[WARN][${ctx}] ${msg}`;
}

function logError(msg, context=null) {
    let ctx = getCtx(context);
    console.log(ac.bold.bgRed(`[${ctx}]`)+' '+msg);
    logHistory.push({ts: now(), type: 'ERROR', ctx: context, msg});
    return `[ERROR][${ctx}] ${msg}`;
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
