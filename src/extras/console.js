const chalk = require('chalk');
const header = 'txAdmin';


//================================================================
function log(msg, context=null){
    let tag = (context !== null)? header+':'+context : header;
    console.log(chalk.bold.bgBlue(`[${tag}]`)+' '+msg);
}

function logOk(msg, context=null){
    let tag = (context !== null)? header+':'+context : header;
    console.log(chalk.bold.bgGreen(`[${tag}]`)+' '+msg);
}

function logWarn(msg, context=null) {
    let tag = (context !== null)? header+':'+context : header;
    console.log(chalk.bold.bgYellow(`[${tag}]`)+' '+msg);
}

function logError(msg, context=null) {
    let tag = (context !== null)? header+':'+context : header;
    console.log(chalk.bold.bgRed(`[${tag}]`)+' '+msg);
}

function cleanTerminal(){
    console.log("\n\n\n\n\n\n\n\n");
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
    dir
}
