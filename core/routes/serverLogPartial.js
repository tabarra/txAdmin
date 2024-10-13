const modulename = 'WebServer:ServerLogPartial';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the admin log.
 * @param {object} ctx
 */
export default async function ServerLogPartial(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('server.log.view')) {
        return sendTypedResp({ error: 'You don\'t have permission to call this endpoint.' });
    }

    const isDigit = /^\d{13}$/;
    const sliceSize = 500;

    if (ctx.request.query.dir === 'older' && isDigit.test(ctx.request.query.ref)) {
        const log = globals.logger.server.readPartialOlder(ctx.request.query.ref, sliceSize);
        return ctx.send({
            boundry: log.length < sliceSize,
            log,
        });
    } else if (ctx.request.query.dir === 'newer' && isDigit.test(ctx.request.query.ref)) {
        const log = globals.logger.server.readPartialNewer(ctx.request.query.ref, sliceSize);
        return ctx.send({
            boundry: log.length < sliceSize,
            log,
        });
    } else {
        return ctx.send({
            boundry: true,
            log: globals.logger.server.getRecentBuffer(),
        });
    }
};
