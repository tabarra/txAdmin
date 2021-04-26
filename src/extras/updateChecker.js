//Requires
const modulename = 'WebServer:updateChecker';
const axios = require('axios');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };

/*
    TODO:
    Create an page with the changelog, that queries for the following endpoint and caches it for 15 minutes:
        https://changelogs-live.fivem.net/api/changelog/versions/2385/2375?tag=server
    Maybe even grab the data from commits:
        https://changelogs-live.fivem.net/api/changelog/versions/2077
*/

module.exports = async () => {
    try {
        //perform request - cache busting every ~1.4h
        const osTypeApiUrl = (GlobalData.osType == 'windows') ? 'win32' : 'linux';
        const cacheBuster = Math.floor(now() / 5e3);
        const reqUrl = `https://changelogs-live.fivem.net/api/changelog/versions/${osTypeApiUrl}/server?${cacheBuster}`;
        const changelogReq = await axios.get(reqUrl);

        //check response
        if (!changelogReq.data) throw new Error('request failed');
        const changelog = changelogReq.data;
        if (anyUndefined(changelog.recommended, changelog.optional, changelog.latest, changelog.critical)) {
            throw new Error('expected values not found');
        }
        if (GlobalData.verbose) log(`Checked for updates. Latest version is ${changelog.latest}`);
        //FIXME: CHECK FOR BROKEN ORDER

        //fill in databus
        const osTypeRepoUrl = (GlobalData.osType == 'windows') ? 'server_windows' : 'proot_linux';
        globals.databus.updateChecker = {
            artifactsLink: `https://runtime.fivem.net/artifacts/fivem/build_${osTypeRepoUrl}/master/?${cacheBuster}`,
            recommended: parseInt(changelog.recommended),
            optional: parseInt(changelog.optional),
            latest: parseInt(changelog.latest),
            critical: parseInt(changelog.critical),
        };
    } catch (error) {
        if (GlobalData.verbose) logWarn(`Failed to retrieve FXServer update data with error: ${error.message}`);
        if (globals.databus.updateChecker === null) globals.databus.updateChecker = false;
    }
};
