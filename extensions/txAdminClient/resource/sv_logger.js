//Requires
const utils = require('./utils.js')

//Helpers
const log = (x)=>{console.log(`^5[txAdminClientJS]^0 ${x}`)}
const dir = (x)=>{console.dir(x)}
const isUndefined = (x) => { return (typeof x === 'undefined') };
const logError = (err) => {
    if(typeof err === 'string'){
        console.log(`^5[txAdminClient:Error]^1 ${err}^0`);
    }else{
        console.log(`^5[txAdminClient:Error]^1 ${err.message}^0`);
        try {
            err.stack.forEach(trace => {
                console.log(`\t=> ${trace.file}:${trace.line} > ${trace.name}`)
            });
        } catch (error) {
            console.log('Error stack unavailable.')
        }
        console.log()
    }
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
        log('Logger started');
        this.log = [{
            timestamp: (Date.now() / 1000).toFixed(),
            action: "txAdminClient:Started",
            source: false,
            data: false
        }];

        //Attempt to set env vars
        this.txAdminPort = GetConvar("txAdmin-apiPort", "invalid");
        this.txAdminToken = GetConvar("txAdmin-apiToken", "invalid");
        if(this.txAdminPort === 'invalid' || this.txAdminToken === 'invalid'){
            logError('API Port and Token ConVars not found. Do not start this resource if not using txAdmin.') 
        }

        //Attempt to flush log to txAdmin, starting after 10 seconds
        setTimeout(() => {
            setInterval(() => {
                this.flushLog();
            }, 2500);
        }, 10000);
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
            txAdminToken: this.txAdminToken,
            log: this.log
        })
        utils.postJson(`http://localhost:${this.txAdminPort}/intercom/logger`, postData)
            .then((data) => {
                if(data.statusCode === 413){
                    log(`Logger upload failed with code 413 and body ${data.body}`);
                    //TODO: introduce a buffer to re-upload the log in parts.
                    this.log = [{
                        timestamp: (Date.now() / 1000).toFixed(),
                        action: "DebugMessage",
                        source: false,
                        data: `wiped log with size ${postData.length} due to upload limit`
                    }];
                }else if(data.statusCode === 200){
                    this.log = [];
                }else{
                    log(`Logger upload failed with code ${data.statusCode} and body ${data.body}`);
                }
            })
            .catch((error) => {
                log(`Logger upload failed with error: ${error.message}`);
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
    //Decoding explosion type
    let types = ['DONTCARE', 'GRENADE', 'GRENADELAUNCHER', 'STICKYBOMB', 'MOLOTOV', 'ROCKET', 'TANKSHELL', 'HI_OCTANE', 'CAR', 'PLANE', 'PETROL_PUMP', 'BIKE', 'DIR_STEAM', 'DIR_FLAME', 'DIR_WATER_HYDRANT', 'DIR_GAS_CANISTER', 'BOAT', 'SHIP_DESTROY', 'TRUCK', 'BULLET', 'SMOKEGRENADELAUNCHER', 'SMOKEGRENADE', 'BZGAS', 'FLARE', 'GAS_CANISTER', 'EXTINGUISHER', 'PROGRAMMABLEAR', 'TRAIN', 'BARREL', 'PROPANE', 'BLIMP', 'DIR_FLAME_EXPLODE', 'TANKER', 'PLANE_ROCKET', 'VEHICLE_BULLET', 'GAS_TANK', 'BIRD_CRAP', 'RAILGUN', 'BLIMP2', 'FIREWORK', 'SNOWBALL', 'PROXMINE', 'VALKYRIE_CANNON', 'AIR_DEFENCE', 'PIPEBOMB', 'VEHICLEMINE', 'EXPLOSIVEAMMO', 'APCSHELL', 'BOMB_CLUSTER', 'BOMB_GAS', 'BOMB_INCENDIARY', 'BOMB_STANDARD', 'TORPEDO', 'TORPEDO_UNDERWATER', 'BOMBUSHKA_CANNON', 'BOMB_CLUSTER_SECONDARY', 'HUNTER_BARRAGE', 'HUNTER_CANNON', 'ROGUE_CANNON', 'MINE_UNDERWATER', 'ORBITAL_CANNON', 'BOMB_STANDARD_WIDE', 'EXPLOSIVEAMMO_SHOTGUN', 'OPPRESSOR2_CANNON', 'MORTAR_KINETIC', 'VEHICLEMINE_KINETIC', 'VEHICLEMINE_EMP', 'VEHICLEMINE_SPIKE', 'VEHICLEMINE_SLICK', 'VEHICLEMINE_TAR', 'SCRIPT_DRONE', 'RAYGUN', 'BURIEDMINE', 'SCRIPT_MISSIL'];
    if(ev.explosionType < -1 || ev.explosionType > 72){
        ev.explosionType = 'UNKNOWN';
    }else{
        ev.explosionType =  types[ev.explosionType+1]
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

onNet('txaLogger:CommandExecuted', (data) => {
    try {
        logger.r(global.source, 'CommandExecuted', data);
    } catch (error) {
        logError(error)
    }
});

onNet('txaLogger:DebugMessage', (data) => {
    try {
        logger.r(global.source, 'DebugMessage', data);
    } catch (error) {
        logError(error)
    }
});

const logChatMessage = (src, author, text)=>{
    try {
        let toLogData = {
            author,
            text
        }
        logger.r(src, 'ChatMessage', toLogData);
    } catch (error) {
        logError(error)
    }
}
onNet('chatMessage', logChatMessage);
onNet('txaLogger:internalChatMessage', logChatMessage);
