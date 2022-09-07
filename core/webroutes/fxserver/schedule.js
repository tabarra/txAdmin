const modulename = 'WebServer:FXServerSchedule';
import logger from '@core/extras/console.js';
import { GlobalStyles } from '@mui/styled-engine';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Handle all the server scheduler commands
 * @param {object} ctx
 */
export default async function FXServerSchedule(ctx) {
    if (
        typeof ctx.request.body.action === 'undefined'
        || typeof ctx.request.body.parameter === 'undefined'
    ) {
        return ctx.send({
            type: 'danger',
            message: `invalid request`,
        });
    }
    const {action, parameter} = ctx.request.body;

    //Check permissions
    if (!ctx.utils.checkPermission('control.server', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    if (action == 'setNextTempSchedule') {
        try {
            globals.scheduler.setNextTempSchedule(parameter);
            ctx.utils.logAction(`Scheduling server restart at ${parameter}`);
            return ctx.send({
                type: 'success',
                message: 'Restart scheduled.',
            });
        } catch (error) {
            return ctx.send({
                type: 'danger',
                message: error.message,
            });
        }

    } else if (action == 'setNextSkip') {
        try {
            const enabled = (parameter === 'true');
            globals.scheduler.setNextSkip(enabled);
            const logAct = enabled ? 'Cancelling' : 'Re-enabling';
            ctx.utils.logAction(`${logAct} next scheduled restart.`);
            return ctx.send({
                type: 'success',
                message: 'Schedule changed.',
            });
        } catch (error) {
            return ctx.send({
                type: 'danger',
                message: error.message,
            });
        }

    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown Action.',
        });
    }
};
