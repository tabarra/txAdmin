//Requires
const modulename = 'WebServer:Resources';
const path = require('path');
const slash = require('slash');
const slug = require('slug');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const breakPath = (inPath) => {return slash(path.normalize(inPath)).split('/').filter(String);};
const dynamicSort = (prop) => {
    let sortOrder = 1;
    if (prop[0] === '-') {
        sortOrder = -1;
        prop = prop.substr(1);
    }
    return function (a, b) {
        const result = (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
        return result * sortOrder;
    };
};
const getResourceSubPath = (resPath) => {
    if (resPath.indexOf('system_resources') >= 0) return 'system_resources';
    if (!path.isAbsolute(resPath)) return resPath;

    let serverDataPathArr = breakPath(`${globals.fxRunner.config.serverDataPath}/resources`);
    let resPathArr = breakPath(resPath);
    for (let i = 0; i < serverDataPathArr.length; i++) {
        if (isUndefined(resPathArr[i])) break;
        if (serverDataPathArr[i].toLowerCase() == resPathArr[i].toLowerCase()) {
            delete resPathArr[i];
        }
    }
    resPathArr.pop();
    resPathArr = resPathArr.filter(String);

    if (resPathArr.length) {
        return resPathArr.join('/');
    } else {
        return 'root';
    }
};

/**
 * Returns the resources list
 * @param {object} ctx
 */
module.exports = async function Resources(ctx) {
    if (globals.fxRunner.fxChild === null) {
        return ctx.utils.render('basic/generic', {
            message: '<strong>The resources list is only available when the server is online.</strong>',
        });
    }

    const timeoutMessage = `<strong>Couldn't load the resources list.</strong> <br>
    - Make sure the server is online (try to join it). <br>
    - Make sure you don't have more than 200 resources. <br>
    - Make sure you are not running the fxserver outside txAdmin. <br>
    - Check <a href="console">Live Console</a> for any errors. They may indicate that some resource has a malformed <code>fxmanifest</code> file.`;

    //Send command request
    const cmdSuccess = globals.fxRunner.srvCmd('txaReportResources');
    if (!cmdSuccess) {
        return ctx.utils.render('basic/generic', {message: timeoutMessage});
    }

    //Timer fot list delivery
    let tListTimer;
    let tErrorTimer;
    const tList = new Promise((resolve, reject) => {
        tListTimer = setInterval(() => {
            if (
                globals.databus.resourcesList !== null
                && (new Date() - globals.databus.resourcesList.timestamp) <= 1000
                && Array.isArray(globals.databus.resourcesList.data)
            ) {
                clearTimeout(tListTimer);
                clearTimeout(tErrorTimer);
                const resGroups = processResources(globals.databus.resourcesList.data);
                const renderData = {
                    headerTitle: 'Resources',
                    resGroupsJS: JSON.stringify(resGroups),
                    resGroups,
                    disableActions: (ctx.utils.checkPermission('commands.resources')) ? '' : 'disabled',
                };
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
    const [view, renderData] = await Promise.race([tList, tError]);
    return ctx.utils.render(view, renderData);
};


//================================================================
/**
 * Returns the Processed Resource list.
 * @param {array} resList
 */
function processResources(resList) {
    //Clean resource data and add it so an object separated by subpaths
    const resGroupList = {};
    resList.forEach((resource) => {
        if (isUndefined(resource.name) || isUndefined(resource.status) || isUndefined(resource.path) || resource.path === '') {
            return;
        }
        const subPath = getResourceSubPath(resource.path);
        const resData = {
            name: resource.name,
            divName: slug(resource.name),
            status: resource.status,
            statusClass: (resource.status === 'started') ? 'success' : 'danger',
            // path: slash(path.normalize(resource.path)),
            version: (resource.version) ? `(${resource.version.trim()})` : '',
            author: (resource.author) ? `${resource.author.trim()}` : '',
            description: (resource.description) ? resource.description.trim() : '',
        };

        if (resGroupList.hasOwnProperty(subPath)) {
            resGroupList[subPath].push(resData);
        } else {
            resGroupList[subPath] = [resData];
        }
    });

    //Generate final array with subpaths and div ids
    const finalList = [];
    Object.keys(resGroupList).forEach((subPath) => {
        const subPathData = {
            subPath: subPath,
            divName: slug(subPath),
            resources: resGroupList[subPath].sort(dynamicSort('name')),
        };
        finalList.push(subPathData);
    });

    // finalList = JSON.stringify(finalList, null, 2)
    // console.log(finalList)
    // return []
    return finalList;
}
