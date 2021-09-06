//Requires
const modulename = 'WebServer:ServerLog';
const xss = require('../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };

//DEBUG testing stuff
// let cnt = 0;
// setInterval(() => {
//     cnt++;
//     if (cnt > 100) cnt = 1;
//     const test = {
//         timestamp: Math.round(Date.now() / 1000),
//         action: 'DebugMessage',
//         source: {name: 'console', identifiers: []},
//         data: cnt + '='.repeat(cnt),
//     };
//     globals.databus.serverLog.push(test);
//     if (globals.databus.serverLog.length > 64) globals.databus.serverLog = globals.databus.serverLog.slice(-10);
// }, 750);


/**
 * Returns the output page containing the admin log.
 * @param {object} ctx
 */
module.exports = async function ServerLog(ctx) {
    const offset = (ctx.params && typeof ctx.params.offset === 'string')
        ? parseInt(ctx.params.offset)
        : false;
    const serverLog = globals.databus.serverLog; //shorthand

    //If page
    if (!offset) {
        const log = processLog(serverLog.slice(-100));
        const renderData = {
            headerTitle: 'Server Log',
            offset: serverLog.length,
            log,
        };
        return ctx.utils.render('serverLog', renderData);

    //If offset
    } else if (!isNaN(offset)) {
        if (offset === serverLog.length) {
            return ctx.send({offset: serverLog.length, log : false});
        } else {
            const log = processLog(serverLog.slice(offset));
            return ctx.send({offset: serverLog.length, log});
        }

    //If null
    } else {
        const log = processLog(serverLog.slice(-100));
        return ctx.send({offset: serverLog.length, log});
    }
};


//================================================================
/**
 * Returns the Processed Log.
 * @param {array} resList
 */
function processLog(logArray) {
    let out = '';
    logArray.forEach((event) => {
        if (
            isUndefined(event.timestamp)
            || isUndefined(event.action)
            || isUndefined(event.source)
            || isUndefined(event.data)
        ) {
            return;
        }
        const time = new Date(parseInt(event.timestamp) * 1000).toLocaleTimeString();
        const source = processPlayerData(event.source);
        const eventMessage = processEventTypes(event);
        out += `[${time}] ${source} ${eventMessage}\n`;
    });

    return out;
}


//================================================================
/**
 * Returns the Processed Player.
 * @param {array} resList
 */
function processPlayerData(src) {
    if (
        typeof src !== 'object'
        || typeof src.name !== 'string'
        || !Array.isArray(src.identifiers)
    ) {
        return '<span class="text-secondary event-source">unknown</span>';
    }

    if (src.name === 'console') {
        return '<span class="text-dark event-source">CONSOLE</span>';
    }

    let name = xss(src.name).replace(/"/g, '&quot;');
    let identifiers = xss(src.identifiers.join(';')).replace(/"/g, '&quot;');
    return `<span data-player-identifiers="${identifiers}" data-player-name="${name}" class="text-primary event-source">${name}</span>`;
}


//================================================================
/**
 * Returns the Processed Event.
 * @param {array} resList
 */
function processEventTypes(event) {
    //TODO: normalize/padronize actions
    if (event.action === 'playerConnecting') {
        return 'connected';
    } else if (event.action === 'playerDropped') {
        return 'disconnected';
    } else if (event.action === 'ChatMessage') {
        let authorTag;
        if (typeof event.data.author === 'string' && event.data.author !== event.source.name) {
            authorTag = `(${event.data.author})`;
        } else {
            authorTag = '';
        }

        let text = (typeof event.data.text === 'string') ? event.data.text.replace(/\^([0-9])/g, '') : 'unknownText';
        return xss(`${authorTag}: ${text}`);
    } else if (event.action === 'DeathNotice') {
        let cause = event.data.cause || 'unknown';
        if (event.data.killer) {
            let killer = processPlayerData(event.data.killer);
            return `died from ${xss(cause)} by ${killer}`;
        } else {
            return `died from ${xss(cause)}`;
        }
    } else if (event.action === 'explosionEvent') {
        let expType = event.data.explosionType || 'UNKNOWN';
        return `caused an explosion (${expType})`;
    } else if (event.action === 'CommandExecuted') {
        let command = event.data || 'unknown';
        return `executed: /${xss(command)}`;
    } else if (event.action === 'txAdminClient:Started') {
        return 'txAdminClient Logger started';
    } else if (event.action === 'DebugMessage') {
        let message = event.data || 'unknown';
        return `txAdminClient Debug Message: <span class="text-warning">${xss(message)}</span>`;
    } else if (event.action === 'MenuEvent') {
        let data = event.data || {event: 'unknown', allowed: false};
        const message = xss(data.message);
        return !data.allowed ? `was blocked from ${message}` : `is ${message}`;
    } else {
        const action = xss(event.action);
        if (GlobalData.verbose) {
            logWarn(`Unrecognized event: ${action}`);
            dir(event);
        }
        return `${action}`;
    }
}
