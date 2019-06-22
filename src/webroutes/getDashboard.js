//Requires
const semver = require('semver');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getDashboard';


/**
 * Returns the output page containing the Dashboard (index)
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {

    //Processing data for the update available alert
    let diff;
    try {
        diff = semver.diff(globals.version.current, globals.version.latest);
    } catch (error) {
        diff = 'major';
    }
    let update = {
        currentVersion: globals.version.current,
        latestVersion: globals.version.latest,
        changes: []
    }
    if(diff == 'major'){
        update.class = 'danger';
    }else if(diff == 'minor'){
        update.class = 'warning';
    }else if(diff == 'patch'){
        update.class = 'info';
    }else{
        update.class = 'dark';
    }

    //Processing the version history and only picking the new ones
    globals.version.allVersions.forEach(version => {
        try {
            if(semver.gt(version.version, globals.version.current)){
                update.changes.push(version);
            }
        } catch (error) {}
    });
    update.changes = update.changes.reverse();

    //Rendering the page
    let out = await webUtils.renderMasterView('dashboard', {update: update});
    return res.send(out);
};
