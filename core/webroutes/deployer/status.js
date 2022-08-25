const modulename = 'WebServer:DeployerStatus';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
export default async function DeployerStatus(ctx) {
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
