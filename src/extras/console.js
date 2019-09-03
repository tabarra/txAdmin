const ac = require('ansi-colors');
ac.enabled = require('color-support').hasBasic;
const header = 'txAdmin';


//================================================================
function log(msg, context=null){
    let tag = (context !== null)? header+':'+context : header;
    console.log(ac.bold.bgBlue(`[${tag}]`)+' '+msg);
}

function logOk(msg, context=null){
    let tag = (context !== null)? header+':'+context : header;
    console.log(ac.bold.bgGreen(`[${tag}]`)+' '+msg);
}

function logWarn(msg, context=null) {
    let tag = (context !== null)? header+':'+context : header;
    console.log(ac.bold.bgYellow(`[${tag}]`)+' '+msg);
}

function logError(msg, context=null) {
    let tag = (context !== null)? header+':'+context : header;
    console.log(ac.bold.bgRed(`[${tag}]`)+' '+msg);
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

//================================================================
module.exports = {
    log,
    logOk,
    logWarn,
    logError,
    cleanTerminal,
    setTTYTitle,
    dir
}
