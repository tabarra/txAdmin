//Requires
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../../extras/console');
const webUtils = require('./../../webUtils.js');
const context = 'WebServer:Experiments-Bans-Get';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = async (res, req, error)=>{
    logError(`Failed to read the bans from the database with error: ${error.message}`, context);
    if(globals.config.verbose) dir(error);
    let message = `Error loading this experimental page, please copy the error on the terminal and report in the Discord Server.`;
    let out = await webUtils.renderMasterView('basic/generic', req.session, {message});
    return res.send(out);
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check permissions
    if(!webUtils.checkPermission(req, 'all', context)){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    //Getting the database data
    let isEnabled;
    let banList;
    try {
        let dbo = globals.database.getDB();
        isEnabled = await dbo.get("experiments.bans.enabled").value();
        banList = await dbo.get("experiments.bans.banList").value();
    } catch (error) {
        return await handleError(res, req, error);
    }

    //Checking if enabled
    if(!isEnabled){
        let renderData = {
            headerTitle: 'Bans',
            expEnabled: false,
            log: ""
        }
        let out = await webUtils.renderMasterView('experiments/bans', req.session, renderData);
        return res.send(out);
    }

    //Prepares the log
    let log = processLog(banList);
    if(log === false) return await handleError(res, req, new Error('experiments.bans.banList is not an array'));

    let renderData = {
        headerTitle: 'Bans',
        expEnabled: true,
        log
    }
    let out = await webUtils.renderMasterView('experiments/bans', req.session, renderData);
    return res.send(out);
};


//================================================================
/**
 * Returns the Processed Log.
 * @param {array} banList
 */
function processLog(banList){
    if(!Array.isArray(banList)) return false;

    let out = '';
    banList.forEach(ban => {
        if(
            isUndefined(ban.timestamp) ||
            isUndefined(ban.banned_by) ||
            isUndefined(ban.identifier) ||
            isUndefined(ban.reason)
        ){
            return;
        }
        let time = new Date(parseInt(ban.timestamp)*1000).toLocaleTimeString()
        out += `<li><a href="/experiments/bans#!" data-player-identifier="${xss(ban.identifier)}" class="text-primary unban-btn">[unban]</a>
                    [${time}] <code>${xss(ban.identifier)}</code> - ${xss(ban.reason)} (${xss(ban.banned_by)})</li>\n`;
    });

    return out;
}
