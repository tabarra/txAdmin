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
    //Preparing render data
    let renderData = {
        //FIXME: temp missing resource detector
        resNotFound: globals.resourceNotFound,
        updateData: getUpdateData(),
        chartData: getChartData(globals.monitor.timeSeries.get())
    }

    //Rendering the page
    let out = await webUtils.renderMasterView('dashboard', renderData);
    return res.send(out);
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

    //TODO: those are random values, do it via some calculation to maintain consistency.
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
 * Returns the update data
 */
function getUpdateData() {
    let diff;
    try {
        diff = semver.diff(globals.version.current, globals.version.latest);
    } catch (error) {
        diff = 'major';
    }
    let updateData = {
        currentVersion: globals.version.current,
        latestVersion: globals.version.latest,
        changes: []
    }
    if (diff == 'major') {
        updateData.class = 'danger';
    } else if (diff == 'minor') {
        updateData.class = 'warning';
    } else if (diff == 'patch') {
        updateData.class = 'info';
    } else {
        updateData.class = 'dark';
    }

    //Processing the version history and only picking the new ones
    globals.version.allVersions.forEach(version => {
        try {
            if (semver.gt(version.version, globals.version.current)) {
                updateData.changes.push(version);
            }
        } catch (error) { }
    });
    updateData.changes = updateData.changes.reverse();

    return updateData;
}
