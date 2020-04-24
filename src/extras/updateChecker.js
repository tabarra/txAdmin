//Requires
const modulename = 'WebServer:updateChecker';
const axios = require("axios");
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);

//Helpers
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };

module.exports = async () => {
    try {
        //perform request
        let osTypeUrl = (GlobalData.osType == 'windows')? 'win32' : 'linux';
        let changelogReq = await axios.get(`https://changelogs-live.fivem.net/api/changelog/versions/${osTypeUrl}/server`);

        //check response
        if(!changelogReq.data) throw new Error('request failed');
        changelog = changelogReq.data;
        if(anyUndefined(changelog.recommended, changelog.optional, changelog.latest, changelog.critical)){
            throw new Error('expected values not found');
        }
        //FIXME: CHECK FOR BROKEN ORDER

        //fill in databus
        if(GlobalData.verbose) log(`Checked for updates. Latest version is ${changelog.latest}`);
        globals.databus.updateChecker = {
            recommended: parseInt(changelog.recommended),
            optional: parseInt(changelog.optional),
            latest: parseInt(changelog.latest),
            critical: parseInt(changelog.critical),
        }
    } catch (error) {
        if(GlobalData.verbose) logWarn(`Failed to retrieve FXServer update data with error: ${error.message}`);
    }
}
