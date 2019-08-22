//Requires
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getServerLog';


/**
 * Returns the output page containing the admin log.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    // dir(globals.intercomTempLog)

    // const fs = require('fs')
    // // fs.writeFileSync('tmplog.json', JSON.stringify(logArray,null,2))
    // let tmpLog = JSON.parse(fs.readFileSync('tmplog.json'));
    // let log = processLog(tmpLog);

    let log = processLog(globals.intercomTempLog);
    let out = await webUtils.renderMasterView('serverLog', {headerTitle: 'Server Log', log});
    return res.send(out);
};


//================================================================
/**
 * Returns the Processed Log.
 * @param {array} resList
 */
function processLog(logArray){
    dir(logArray)
    if(!logArray.length) return false;

    let out = [];
    //FIXME: validate event object
    logArray.forEach(event => {
        let time = new Date(event.timestamp).toLocaleTimeString()
        let source = processPlayerData(event.source);
        let eventMessage = processEventTypes(event)
        out.push(`[${time}] ${source} ${eventMessage}`)
    });

    return out.join('\n');
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

    return `<a href="/serverLog#!" class="text-primary event-source">${xss(src.name)}</a>`;
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

        let text = (typeof event.data.text === 'string')? event.data.text : 'unknownText';
        return `${authorTag}: ${text}`;

    }else if(event.action === 'DeathNotice'){
        return `died`;

    }else{
        return `${event.action}`;
    }
}



/*
Exemplos:
    13:37:02 <player> connected
    13:37:02 <player> disconnected
    13:37:02 <player> died from reason
    13:37:02 <player> died from reason by <killer>
    13:37:02 <player> <author>: <message>
    13:37:02 console <author>: <message>
*/
