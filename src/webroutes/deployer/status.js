//Requires
const modulename = 'WebServer:DeployerStatus';
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function DeployerStatus(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({success: false, refresh: true});
    }

    //Check if this is the correct state for the deployer
    if(globals.deployer == null){
        return ctx.send({success: false, refresh: true});
    }

    const rawLog = `Starting deployment...
Cloning repository: https://github.com/citizenfx/cfx-server-data.git`;

    return ctx.send({
        progress: Math.round(Math.random()*100),
        status: 'running', 
        log: rawLog,
        // log: xss(rawLog).replace(/\n+/, '<br>'), 
    });
};
