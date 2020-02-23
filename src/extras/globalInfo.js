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
    let info = {};

    info.osType =  os.type() || 'unknown';
    info.dataPath =  dataPath;
    info.txAdminPort =  txAdminPort;
    info.serverProfile =  serverProfile;
    info.serverProfilePath =  serverProfilePath;
    info.fxserverVersion =  getBuild(GetConvar('version', 'false'));
    info.txAdminResourcePath = cleanPath(GetResourcePath(GetCurrentResourceName()))

    return info;
}
