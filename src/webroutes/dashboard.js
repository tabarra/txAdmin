//Requires
const modulename = 'WebServer:Dashboard';
const semver = require('semver');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/**
 * Returns the output page containing the Dashboard (index)
 * @param {object} ctx
 */
module.exports = async function Dashboard(ctx) {
    //If the any FXServer configuration is missing
    if(globals.fxRunner.config.serverDataPath === null || globals.fxRunner.config.cfgPath === null){
        return ctx.response.redirect('/setup');
    }

    //Shortcut function
    let getPermDisable = (perm) => {
        return (ctx.utils.checkPermission(perm, modulename, false))? '' : 'disabled'
    }

    //Preparing render data
    let renderData = {
        serverName: globals.config.serverName,
        versionData: getVersionData(),
        chartData: getChartData(globals.monitor.timeSeries.get()),
        perms:{
            commandMessage: getPermDisable('commands.message'),
            commandKick: getPermDisable('commands.kick'),
            commandResources: getPermDisable('commands.resources'),
            controls: getPermDisable('control.server'),
            controlsClass: (ctx.utils.checkPermission('control.server', modulename, false))? 'danger' : 'secondary'
        }
    }


    //Rendering the page
    return ctx.utils.render('dashboard', renderData);
};


//================================================================
/**
 * Process player history and returns the chart data or false
 * @param {array} series
 */
function getChartData(series) {
    if (series.length < 360) {
        return false;
    }

    //TODO: those are arbitrary values, do it via some calculation to maintain consistency.
    let mod;
    if (series.length > 6000) {
        mod = 32;
    } else if (series.length > 2000) {
        mod = 18;
    } else {
        mod = 6
    }

    let chartData = [];
    for (let i = 0; i < series.length; i++) {
        if (i % mod === 0) {
            chartData.push({
                t: series[i].timestamp * 1000,
                y: series[i].value.toString()
            });
        }
    }

    return JSON.stringify(chartData);

}


//================================================================
/**
 * Returns the update data.
 * 
 * FIXME: improve the message to show suggestion based on weathor or not the user is an "early adopter".
 * 
 *   Logic:
 *    if == recommended, you're fine
 *    if > recommended && < optional, pls update to optional
 *    if == optional, you're fine
 *    if > optional && < latest, pls update to latest
 *    if == latest, duh
 *    if < critical, BIG WARNING
 * 
 *   For the changelog page, see if possible to show the changelog timeline color coded.
 *   ex: all versions up to critical are danger, then warning, info and secondary for the above optional
 * 
 */
function getVersionData() {
    // Prepping vars & checking if there is data available
    let curr = GlobalData.fxServerVersion;
    let rVer = globals.databus.updateChecker;
    if(!rVer){
        return {
            artifactsLink: false,
            color: false,
            message: false,
            subtext: false,
        };
    }
    let versionData = {
        artifactsLink: rVer.artifactsLink,
        color: false,
        message: false,
        subtext: false,
    };

    //Processing version data
    try {
        if(curr < rVer.critical){
            versionData.color = 'danger';
            versionData.message = 'A critical update is available for FXServer, you should update now.';
            versionData.subtext = (rVer.critical > rVer.recommended)
                                    ? `(critical update ${curr} ➤ ${rVer.critical})`
                                    : `(recommended update ${curr} ➤ ${rVer.recommended})`;
            
        }else if(curr < rVer.recommended){
            versionData.color = 'warning';
            versionData.message = 'A recommended update is available for FXServer, you should update.';
            versionData.subtext = `(recommended update ${curr} ➤ ${rVer.recommended})`;
    
        }else if(curr < rVer.optional){
            versionData.color = 'info';
            versionData.message = 'An optional update is available for FXServer.';
            versionData.subtext = `(optional update ${curr} ➤ ${rVer.optional})`;
        }

    } catch (error) {
        logError(`Error while processing changelog. Enable verbosity for more information.`);
        if(GlobalData.verbose) dir(error);
    }

    return versionData;
}
