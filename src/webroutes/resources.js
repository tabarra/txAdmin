//Requires
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:Resources';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const breakPath = (inPath) => {return slash(path.normalize(inPath)).split('/').filter(String)};
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
const getResourceSubPath = (resPath) => {
    if(!path.isAbsolute(resPath)) return resPath;

    let basePathArr = breakPath(`${globals.fxRunner.config.basePath}/resources`);
    let resPathArr = breakPath(resPath);
    for (let i = 0; i < basePathArr.length; i++) {
        if(isUndefined(resPathArr[i])) break;
        if(basePathArr[i].toLowerCase() == resPathArr[i].toLowerCase()){
            delete resPathArr[i];
        }
    }
    let resName = resPathArr.pop();
    resPathArr = resPathArr.filter(String);

    if(resPathArr.length){
        return resPathArr.join('/');
    }else{
        return 'root';
    }
}

/**
 * Returns the resources list
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let timeoutMessage = `<strong>Couldn't load the resources list.</strong> <br>
    - Make sure the server is online (try to join it). <br>
    - Make sure your fxserver is build/artifact 1550 or above. <br>
    - Make sure you are not running the fxserver outside txAdmin.`;

    //Send command request
    let cmdSuccess = globals.fxRunner.srvCmd(`txaReportResources`);
    if(!cmdSuccess){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: timeoutMessage});
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
                let resGroups = processResources(globals.intercomTempResList.data);
                let renderData = {
                    headerTitle: 'Resources',
                    resGroupsJS: JSON.stringify(resGroups),
                    resGroups,
                    disableActions: (webUtils.checkPermission(req, 'commands.resources'))? '' : 'disabled'
                }
                let out = await webUtils.renderMasterView('resources', req.session, renderData);
                return res.send(out);
            }
        } catch (error) {logError(error, context)}

        //Check execution limit of 1000ms
        cnt++;
        if(cnt > 10){
            clearInterval(intHandle);
            logWarn('the future is now, old man', context);
            try {
                let out = await webUtils.renderMasterView('basic/generic', req.session, {message: timeoutMessage});
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
    //Clean resource data and add it so an object separated by subpaths
    let resGroupList = {}
    resList.forEach(res =>{
        if(isUndefined(res.name) || isUndefined(res.status) || isUndefined(res.path) || res.path === ''){
            return;
        }
        let subPath = getResourceSubPath(res.path);
        let resData = {
            name: res.name,
            status: res.status,
            statusClass: (res.status === 'started')? 'success' : 'danger',
            // path: slash(path.normalize(res.path)),
            version: (res.version)? `(${res.version.trim()})` : '',
            author: (res.author)? `by ${res.author.trim()}` : '',
            description: (res.description)? res.description.trim() : '',
        }

        if(resGroupList.hasOwnProperty(subPath)){
            resGroupList[subPath].push(resData)
        }else{
            resGroupList[subPath] = [resData]
        }
    });

    //Generate final array with subpaths and div ids
    let finalList = []
    Object.keys(resGroupList).forEach(subPath => {
        let subPathData = {
            subPath: subPath,
            divName: subPath.replace(/\W/g, ''),
            resources: resGroupList[subPath].sort(dynamicSort('name'))
        }
        finalList.push(subPathData)
    });

    // finalList = JSON.stringify(finalList, null, 2)
    // console.log(finalList)
    // return []
    return finalList;
}
