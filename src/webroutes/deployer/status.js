//Requires
const modulename = 'WebServer:DeployerStatus';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function DeployerStatus(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('all_permissions', modulename)) {
        return ctx.send({success: false, refresh: true});
    }

    //Check if this is the correct state for the deployer
    if (globals.deployer == null) {
        return ctx.send({success: false, refresh: true});
    }

    //Prepare data
    const outData = {
        progress: globals.deployer.progress,
        log: globals.deployer.getLog(),
    };
    if (globals.deployer.step == 'configure') {
        outData.status = 'done';
    } else if (globals.deployer.deployFailed) {
        outData.status = 'failed';
    } else {
        outData.status = 'running';
    }

    return ctx.send(outData);
};
