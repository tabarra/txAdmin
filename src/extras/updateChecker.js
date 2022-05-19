//Requires
const modulename = 'WebServer:updateChecker';
const got = require('../extras/got');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };

/*
    TODO:
    Create an page with the changelog, that queries for the following endpoint and caches it for 15 minutes:
        https://changelogs-live.fivem.net/api/changelog/versions/2385/2375?tag=server
    Maybe even grab the data from commits:
        https://changelogs-live.fivem.net/api/changelog/versions/5562
    Other relevant apis:
        https://changelogs-live.fivem.net/api/changelog/versions/win32/server? (the one being used below)
        https://changelogs-live.fivem.net/api/changelog/versions
        https://api.github.com/repos/tabarra/txAdmin/releases (changelog in [].body)
*/

module.exports = async () => {
    try {
        //perform request - cache busting every ~1.4h
        const osTypeApiUrl = (GlobalData.osType == 'windows') ? 'win32' : 'linux';
        const cacheBuster = Math.floor(now() / 5e3);
        const reqUrl = `https://changelogs-live.fivem.net/api/changelog/versions/${osTypeApiUrl}/server?${cacheBuster}`;
        const fxsVersions = await got.get(reqUrl).json();

        //check response
        if (typeof fxsVersions !== 'object') throw new Error('request failed');
        if (anyUndefined(fxsVersions.recommended, fxsVersions.optional, fxsVersions.latest, fxsVersions.critical)) {
            throw new Error('expected values not found');
        }
        if (GlobalData.verbose) log(`Checked for updates. Latest version is ${fxsVersions.latest}`);
        //FIXME: CHECK FOR BROKEN ORDER

        //fill in databus
        const osTypeRepoUrl = (GlobalData.osType == 'windows') ? 'server_windows' : 'proot_linux';
        globals.databus.updateChecker = {
            artifactsLink: `https://runtime.fivem.net/artifacts/fivem/build_${osTypeRepoUrl}/master/?${cacheBuster}`,
            recommended: parseInt(fxsVersions.recommended),
            optional: parseInt(fxsVersions.optional),
            latest: parseInt(fxsVersions.latest),
            critical: parseInt(fxsVersions.critical),
        };
    } catch (error) {
        if (GlobalData.verbose) logWarn(`Failed to retrieve FXServer update data with error: ${error.message}`);
        if (globals.databus.updateChecker === null) globals.databus.updateChecker = false;
    }
};
