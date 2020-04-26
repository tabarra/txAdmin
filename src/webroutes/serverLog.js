//Requires
const modulename = 'WebServer:ServerLog';
const xss = require('../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Returns the output page containing the admin log.
 * @param {object} ctx
 */
module.exports = async function ServerLog(ctx) {
    //If page
    if(isUndefined(ctx.query.offset)){
        let log = processLog(globals.databus.serverLog.slice(-100));
        let renderData = {
            headerTitle: 'Server Log',
            offset: globals.databus.serverLog.length,
            log
        }
        return ctx.utils.render('serverLog', renderData);

    //If offset
    }else if(parseInt(ctx.query.offset) !== NaN){
        if(ctx.query.offset === globals.databus.serverLog.length){
            return ctx.send({offset: globals.databus.serverLog.length, log : false});
        }else{
            let log = processLog(globals.databus.serverLog.slice(ctx.query.offset));
            return ctx.send({offset: globals.databus.serverLog.length, log});
        }

    //If null
    }else{
        let log = processLog(globals.databus.serverLog.slice(-100));
        return ctx.send({offset: globals.databus.serverLog.length, log});
    }
};


//================================================================
/**
 * Returns the Processed Log.
 * @param {array} resList
 */
function processLog(logArray){
    let out = '';
    logArray.forEach(event => {
        if(
            isUndefined(event.timestamp) ||
            isUndefined(event.action) ||
            isUndefined(event.source) ||
            isUndefined(event.data)
        ){
            return;
        }
        let time = new Date(parseInt(event.timestamp)*1000).toLocaleTimeString()
        let source = processPlayerData(event.source);
        let eventMessage = processEventTypes(event)
        out += `[${time}] ${source} ${eventMessage}\n`;
    });

    return out;
}


//================================================================
/**
 * Returns the Processed Player.
 * @param {array} resList
 */
function processPlayerData(src){
    if(
        typeof src !== 'object' ||
        typeof src.name !== 'string' ||
        !Array.isArray(src.identifiers)
    ){
        return `<span class="text-secondary event-source">unknown</span>`;
    }

    if(src.name === 'console'){
        return `<span class="text-dark event-source">CONSOLE</span>`;
    }

    let name = xss(src.name).replace(/"/g,'&quot;');
    let identifiers = xss(src.identifiers.join(';')).replace(/"/g,'&quot;');
    return `<a href="/serverLog#!" data-player-identifiers="${identifiers}" data-player-name="${name}" class="text-primary event-source">${name}</a>`;
}


//================================================================
/**
 * Returns the Processed Event.
 * @param {array} resList
 */
function processEventTypes(event){
    //TODO: normalize/padronize actions
    if(event.action === 'playerConnecting'){
        return `connected`;

    }else if(event.action === 'playerDropped'){
        return `disconnected`;

    }else if(event.action === 'ChatMessage'){
        let authorTag;
        if(typeof event.data.author === 'string' && event.data.author !== event.source.name){
            authorTag = `(${event.data.author})`;
        }else{
            authorTag = '';
        }

        let text = (typeof event.data.text === 'string')? event.data.text.replace(/\^([0-9])/g, '') : 'unknownText';
        return xss(`${authorTag}: ${text}`);

    }else if(event.action === 'DeathNotice'){
        let cause = event.data.cause || 'unknown';
        if(event.data.killer){
            let killer = processPlayerData(event.data.killer)
            return `died from ${xss(cause)} by ${killer}`;
        }else{
            return `died from ${xss(cause)}`;
        }

    }else if(event.action === 'explosionEvent'){
        let expType = event.data.explosionType || 'UNKNOWN';
        return `caused an explosion (${expType})`;

    }else if(event.action === 'CommandExecuted'){
        let command = event.data || 'unknown';
        return `executed: /${xss(command)}`;

    }else if(event.action === 'txAdminClient:Started'){
        return `txAdminClient Logger started`;

    }else if(event.action === 'DebugMessage'){
        let message = event.data || 'unknown';
        return `txAdminClient Debug Message: <span class="text-warning">${xss(message)}</span>`;

    }else{
        if(GlobalData.verbose){
            logWarn(`Unrecognized event: ${event.action}`);
            dir(event)
        }
        return `${event.action}`;
    }
}
