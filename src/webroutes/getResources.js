//Requires
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getResources';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const dynamicSort = (prop) => {
    var sortOrder = 1;
    if(prop[0] === "-") {
        sortOrder = -1;
        prop = prop.substr(1);
    }
    return function (a,b) {
        var result = (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
        return result * sortOrder;
    }
}

/**
 * Returns the resources list
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Send command request
    let cmdSuccess = globals.fxRunner.srvCmd(`txaReportResources`);
    if(!cmdSuccess){
        let out = await webUtils.renderMasterView('generic', {message: `Couldn't load the resources list. Make sure the server is online.`});
        return res.send(out);
    }

    let cnt = 0;
    let intHandle = setInterval(async () => {
        //Check if there is fresh data
        try {
            if(
                globals.intercomTempResList !== null &&
                (new Date() - globals.intercomTempResList.timestamp) <= 1000 &&
                Array.isArray(globals.intercomTempResList.data)
            ){
                clearInterval(intHandle);
                let renderData = {
                    headerTitle: 'Resources',
                    resources: processResources(globals.intercomTempResList.data),
                    disableActions: (webUtils.checkPermission(req, 'commands.resources'))? '' : 'disabled'
                }
                let out = await webUtils.renderMasterView('resources', renderData);
                return res.send(out);
            }
        } catch (error) {logError(error, context)}

        //Check execution limit of 1000ms
        cnt++;
        if(cnt > 10){
            clearInterval(intHandle);
            logWarn('the future is now, old man', context);
            try {
                let out = await webUtils.renderMasterView('generic', {message: `Couldn't load the resources list. Make sure the server is online and txAdminClient is running.`});
                return res.send(out);
            } catch (error) {logError(error, context)}
        }
    }, 100);
};


//================================================================
/**
 * Returns the Processed Resource list.
 * @param {array} resList
 */
function processResources(resList){
    let statusColors = {
        missing: 'danger',
        started: 'success',
        starting: 'warning',
        stopped: 'danger',
        stopping: 'warning',
        uninitialized: 'secondary',
        unknown: 'muted',
    }

    //Clean & process list
    resList.forEach((res, index)=>{
        if(isUndefined(res.name) || isUndefined(res.status) || isUndefined(res.path) || res.path === ''){
            delete resList[index];
            return;
        }
        resList[index] = {
            name: res.name,
            status: res.status,
            statusClass: (statusColors[res.status])? statusColors[res.status] : 'muted',
            path: slash(path.normalize(res.path)),
            version: (res.version)? `(${res.version})` : '',
            author: (res.author)? `by ${res.author}` : '',
            description: (res.description)? res.description : '',
        }
    });

    //Return it sorted by path
    return resList.sort(dynamicSort('path'));
}
