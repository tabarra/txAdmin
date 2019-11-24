//Requires
const axios = require("axios");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebServer:updateChecker';


module.exports = async () => {
    try {
        let rVer = await axios.get('https://raw.githubusercontent.com/tabarra/txAdmin/master/version.json');
        rVer = rVer.data;
        if(typeof rVer.version !== 'string' || typeof rVer.changelog !== 'string') throw new Error('Invalid remote version.json file');
        globals.version.latest = rVer.version;
        globals.version.changelog = rVer.changelog;
        globals.version.allVersions = rVer.allVersions || [{version: rVer.version, changelog: rVer.changelog}];
        if(globals.version.current !== rVer.version){
            logWarn(`A new version (v${rVer.version}) is available for txAdmin - https://github.com/tabarra/txAdmin`, 'UpdateChecker');
        }
    } catch (error) {
        logError(`Error checking for updates. Go to the github repository to see if you need one. Its likely an issue with your internet.`, 'UpdateChecker');
        let ver = '9.9.9';
        let msg = `Error checking for updates, if this error persists for more than 4 hours, <br> you probably need to update. <br> This is likely an issue with your server's internet or GitHub.  <br> Check out our <a href="https://discord.gg/f3TsfvD" target="_blank" class="alert-link">Discord Server</a> for more information.`;
        globals.version.latest = ver;
        globals.version.changelog = msg;
        globals.version.allVersions = [{version: ver, changelog: msg}];
    }
}
