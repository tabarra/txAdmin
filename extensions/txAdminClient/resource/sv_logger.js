//Requires
const utils = require('./utils.js')

//Helpers
const log = (x)=>{console.log(x)}
const dir = (x)=>{console.dir(x)}
const isUndefined = (x) => { return (typeof x === 'undefined') };
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
        this.txAdminPort = 'invalid';
        this.txAdminToken = 'invalid';
        this.setupVarsAttempts = 0;
        this.setupVars();

        //Attempt to flush log to txAdmin
        setInterval(() => {
            this.flushLog();
        }, 2500);
    }

    //Attempt to set env vars
    setupVars(){
        if(this.txAdminPort === 'invalid' || this.txAdminToken === 'invalid'){
            if(this.setupVarsAttempts > 5){
                log('[txAdminClient] JS awaiting for environment setup...')
            }
            this.setupVarsAttempts++;
            this.txAdminPort = GetConvar("txAdmin-apiPort", "invalid");
            this.txAdminToken = GetConvar("txAdmin-apiToken", "invalid");
        }
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
        if(this.txAdminPort === 'invalid' || this.txAdminToken === 'invalid'){
            return this.setupVars();
        }

        const postData = JSON.stringify({
            txAdminToken: this.txAdminToken,
            log: this.log
        })
        utils.postJson(`http://localhost:${this.txAdminPort}/intercom/logger`, postData)
            .then((data) => {
                if(data.statusCode === 413){
                    log(`[txAdminClient] Logger upload failed with code 413 and body ${data.body}`);
                    //TODO: introduce a buffer to re-upload the log in parts.
                    this.log = [{
                        timestamp: (Date.now() / 1000).toFixed(),
                        action: "txAdminClient:DebugMessage",
                        source: false,
                        data: `wiped log with size ${postData.length} due to upload limit`
                    }];
                }else if(data.statusCode === 200){
                    this.log = [];
                }else{
                    log(`[txAdminClient] Logger upload failed with code ${data.statusCode} and body ${data.body}`);
                }
            })
            .catch((error) => {
                log(`[txAdminClient] Logger upload failed with error: ${error.message}`);
            });
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
    //Helper function
    const isInvalid = (prop, invValue) => {
        return (typeof prop == 'undefined' || prop === invValue);
    }
    //Filtering out bad event calls
    if(
        isInvalid(ev.damageScale, 0) ||
        isInvalid(ev.cameraShake, 0) ||
        isInvalid(ev.isInvisible, true) ||
        isInvalid(ev.isAudible, false)
    ){
        return;
    }
    //Adding logging data
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
