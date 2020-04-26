//Requires
const modulename = 'WebServer:Resources';
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

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
    if(resPath.indexOf('system_resources') >= 0) return `system_resources`;
    if(!path.isAbsolute(resPath)) return resPath;

    let serverDataPathArr = breakPath(`${globals.fxRunner.config.serverDataPath}/resources`);
    let resPathArr = breakPath(resPath);
    for (let i = 0; i < serverDataPathArr.length; i++) {
        if(isUndefined(resPathArr[i])) break;
        if(serverDataPathArr[i].toLowerCase() == resPathArr[i].toLowerCase()){
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
 * @param {object} ctx
 */
module.exports = async function Resources(ctx) {
    let timeoutMessage = `<strong>Couldn't load the resources list.</strong> <br>
    - Make sure the server is online (try to join it). <br>
    - Make sure your fxserver is build/artifact 1550 or above. <br>
    - Make sure you don't have more than 200 resources. <br>
    - Make sure you are not running the fxserver outside txAdmin.`;

    //Send command request
    let cmdSuccess = globals.fxRunner.srvCmd(`txaReportResources`);
    if(!cmdSuccess){
        return ctx.utils.render('basic/generic', {message: timeoutMessage});
    }

    //Timer fot list delivery
    let tListTimer; 
    let tErrorTimer;
    const tList = new Promise((resolve, reject) => {
        tListTimer = setInterval(() => {
            if(
                globals.databus.resourcesList !== null &&
                (new Date() - globals.databus.resourcesList.timestamp) <= 1000 &&
                Array.isArray(globals.databus.resourcesList.data)
            ){
                clearTimeout(tListTimer);
                clearTimeout(tErrorTimer);
                let resGroups = processResources(globals.databus.resourcesList.data);
                let renderData = {
                    headerTitle: 'Resources',
                    resGroupsJS: JSON.stringify(resGroups),
                    resGroups,
                    disableActions: (ctx.utils.checkPermission('commands.resources'))? '' : 'disabled'
                }
                resolve(['resources', renderData]);
            }
        }, 100);
    });
    
    //Timer for timing out
    const tError = new Promise((resolve, reject) => {
        tErrorTimer = setTimeout(() => {
            clearTimeout(tListTimer);
            resolve(['basic/generic', {message: timeoutMessage}]);
        }, 1000);
    });

    //Start race and give output
    let [view, renderData] = await Promise.race([tList, tError]);
    return ctx.utils.render(view, renderData);
};


//================================================================
/**
 * Returns the Processed Resource list.
 * @param {array} resList
 */
function processResources(resList){
    //Clean resource data and add it so an object separated by subpaths
    let resGroupList = {}
    resList.forEach(resource =>{
        if(isUndefined(resource.name) || isUndefined(resource.status) || isUndefined(resource.path) || resource.path === ''){
            return;
        }
        let subPath = getResourceSubPath(resource.path);
        let resData = {
            name: resource.name,
            divName: resource.name.replace(/%/g, ''),
            status: resource.status,
            statusClass: (resource.status === 'started')? 'success' : 'danger',
            // path: slash(path.normalize(resource.path)),
            version: (resource.version)? `(${resource.version.trim()})` : '',
            author: (resource.author)? `${resource.author.trim()}` : '',
            description: (resource.description)? resource.description.trim() : '',
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
            divName: subPath.replace(/[\W%]/g, ''),
            resources: resGroupList[subPath].sort(dynamicSort('name'))
        }
        finalList.push(subPathData)
    });

    // finalList = JSON.stringify(finalList, null, 2)
    // console.log(finalList)
    // return []
    return finalList;
}
