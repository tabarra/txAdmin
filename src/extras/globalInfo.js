//Requires
const modulename = 'GlobalInfo';
const os = require('os');
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);

//Helpers
//Helper function
const getBuild = (ver)=>{
    try {
        let regex = /v1\.0\.0\.(\d{4,5})\s*/;
        let res = regex.exec(ver);
        return parseInt(res[1]);
    } catch (error) {
        return 0;
    }
}


module.exports = () => {
    let info = {};

    info.osType =  os.type() || 'unknown';
    info.serverProfile =  globals.configVault.serverProfile;
    info.serverProfilePath =  globals.configVault.serverProfilePath;
    info.fxserverVersion =  getBuild(GetConvar('version', 'false'));

    return info;
}
