//Requires
const utils = require('./utils.js')

//Helpers
const log = (x)=>{console.log(x)}
const dir = (x)=>{console.dir(x)}
const logError = (err) => {
    console.log(`[txAdminClient] Error: ${err.message}`);
    try {
        err.stack.forEach(trace => {
            console.log(`\t=> ${trace.file}:${trace.line} > ${trace.name}`)
        });
    } catch (error) {
        console.log('Error stack unavailable.')
    }
    console.log()
}
const getIdentifiers = (src) => {
    let identifiers = [];
    try {
        for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) {
            identifiers.push(GetPlayerIdentifier(src, i))
        }
    } catch (error) {
        logError(error)
    }
    return identifiers;
}
const getPlayerData = (src) => {
    if(src === null || src === false) return false;
    if(src === -1) return {name: 'console', identifiers:[]}
    try {
        return {
            name: GetPlayerName(src),
            identifiers: getIdentifiers(src)
        };
    } catch (error) {
        logError(error)
        return false;
    }
}
const debugPrint = (data) => {
    let sep = '='.repeat(46);
    let json = JSON.stringify(data, null, 2);
    log(`${sep}\n${json}\n${sep}`);
}

//Constants
const txAdminPort = GetConvar("txAdmin-apiPort", "invalid")
const txAdminToken = GetConvar("txAdmin-apiToken", "invalid")


/**
 * Logger class
 */
class Logger {
    constructor(){
        log('[txAdminClient] Logger started');
        this.log = [{
            timestamp: (Date.now() / 1000).toFixed(),
            action: "txAdminClient:Started",
            source: false,
            data: false
        }];

        //Attempt to flush log to txAdmin
        setInterval(() => {
            this.flushLog();
        }, 2500);
    }

    //Register log event
    r(src, action, data){
        let toLog = {
            timestamp: (Date.now() / 1000).toFixed(),
            action,
            source: getPlayerData(src),
            data: (data)? data : false
        }
        this.log.push(toLog)
        // debugPrint(toLog);
    }

    //Flush Log
    flushLog(){
        if(!this.log.length) return;

        const postData = JSON.stringify({
            txAdminToken,
            log: this.log
        })
        utils.postJson(`http://localhost:${txAdminPort}/intercom/logger`, postData)
            .then((data) => {
                if(data == 'okay') this.log = [];
            })
            .catch((err) => logError(err)); //NOTE: less verbosity maybe?
    }
}
logger = new Logger();


//Event handlers
on('playerConnecting', (name, skr, d) => {
    try {
        logger.r(global.source, 'playerConnecting');
    } catch (error) {
        logError(error)
    }
})

on('playerDropped', (reason) => {
    try {
        logger.r(global.source, 'playerDropped');
    } catch (error) {
        logError(error)
    }
})

on('explosionEvent', (source, ev) => {
    try {
        logger.r(source, 'explosionEvent', ev);
    } catch (error) {
        logError(error)
    }
})

onNet('txaLogger:DeathNotice', (killer, cause) => {
    let killerData = null;
    if(killer !== null && killer !== false){
        try {
            killerData = getPlayerData(GetPlayerFromIndex(killer));
        } catch (error) {}
    }
    try {
        let toLogData = {
            cause,
            killer: killerData
        }
        logger.r(global.source, 'DeathNotice', toLogData);
    } catch (error) {
        logError(error)
    }
});

onNet('chatMessage', (src, author, text)=>{
    try {
        let toLogData = {
            author,
            text
        }
        logger.r(src, 'ChatMessage', toLogData);
    } catch (error) {
        logError(error)
    }
})
