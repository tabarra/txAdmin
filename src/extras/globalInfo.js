//Requires
const modulename = 'GlobalInfo';
const os = require('os');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);

//Helpers
const cleanPath = (x) => { return slash(path.normalize(x)) };
const getBuild = (ver)=>{
    try {
        let regex = /v1\.0\.0\.(\d{4,5})\s*/;
        let res = regex.exec(ver);
        return parseInt(res[1]);
    } catch (error) {
        return 0;
    }
}


module.exports = (dataPath, serverProfilePath, serverProfile, txAdminPort) => {
    //Prepare convars
    let buildPathConvar = GetConvar("citizen_root", 'null');
    if(buildPathConvar == 'null') throw new Error('citizen_root convar not set');
    let fxserverVersionConvar = GetConvar('version', 'null');
    if(fxserverVersionConvar == 'null') throw new Error('version convar not set');

    //Build object
    let info = {};
    info.osType =  os.type() || 'unknown';
    info.dataPath =  dataPath;
    info.buildPath = cleanPath(buildPathConvar)+'/';
    info.txAdminPort =  txAdminPort;
    info.serverProfile =  serverProfile;
    info.serverProfilePath =  serverProfilePath;
    info.txAdminResourcePath = cleanPath(GetResourcePath(GetCurrentResourceName()))
    info.fxserverVersion =  getBuild(fxserverVersionConvar);
    info.cfxUrl = null;

    //FIXME: can't do object.freeze() because of `cfxUrl`
    return info;
}
