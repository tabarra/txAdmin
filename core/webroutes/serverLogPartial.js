const modulename = 'WebServer:ServerLogPartial';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the admin log.
 * @param {object} ctx
 */
export default async function ServerLogPartial(ctx) {
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
