//Requires
const modulename = 'WebServer:ExperimentsBansGet';
const xss = require('../../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = (ctx, error)=>{
    logError(`Failed to read the bans from the database with error: ${error.message}`);
    if(GlobalData.verbose) dir(error);
    let message = `Error loading this experimental page, please copy the error on the terminal and report in the Discord Server.`;
    return ctx.utils.render('basic/generic', {message});
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} ctx
 */
module.exports = async function ExperimentsBansGet(ctx) {
    //FIXME: temporarily disabled
    return ctx.utils.error(403, 'Feature temporarily disabled.');

    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    //Getting the database data
    let isEnabled;
    let banList;
    try {
        let dbo = globals.database.getDB();
        isEnabled = await dbo.get("experiments.bans.enabled").value();
        banList = await dbo.get("experiments.bans.banList").value();
    } catch (error) {
        return handleError(ctx, error);
    }

    //Checking if enabled
    if(!isEnabled){
        let renderData = {
            headerTitle: 'Bans',
            expEnabled: false,
            log: ""
        }
        return ctx.utils.render('experiments/bans', renderData);
    }

    //Prepares the log
    let log = processLog(banList);
    if(log === false) return handleError(ctx, new Error('experiments.bans.banList is not an array'));

    let renderData = {
        headerTitle: 'Bans',
        expEnabled: true,
        log
    }
    return ctx.utils.render('experiments/bans', renderData);
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
