const modulename = 'WebServer:TopLevelMw';
import { txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);
import { Next } from "koa";
import { RawKoaCtx } from '../ctxTypes';


//Consts
const timeoutLimit = 47 * 1000; //REQ_TIMEOUT_REALLY_REALLY_LONG is 45s

/**
 * Middleware responsible for timeout/error/no-output/413
 */
const topLevelMw = async (ctx: RawKoaCtx, next: Next) => {
    ctx.set('Server', `txAdmin v${txEnv.txAdminVersion}`);
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            ctx.state.timeout = true;
            reject(new Error());
        }, timeoutLimit);
    });
    try {
        await Promise.race([timeout, next()]);
        clearTimeout(timer);
        if (typeof ctx.body == 'undefined' || (typeof ctx.body == 'string' && !ctx.body.length)) {
            console.verbose.warn(`Route without output: ${ctx.path}`);
            return ctx.body = '[no output from route]';
        }
    } catch (e) {
        const error = e as any; //this has all been previously validated
        const prefix = `[txAdmin v${txEnv.txAdminVersion}]`;
        const reqPath = (ctx.path.length > 100) ? `${ctx.path.slice(0, 97)}...` : ctx.path;
        const methodName = (error.stack && error.stack[0] && error.stack[0].name) ? error.stack[0].name : 'anonym';

        //NOTE: I couldn't force xss on path message, but just in case I'm forcing it here
        //but it is overwritten by koa when we set the body to an object, which is fine
        ctx.type = 'text/plain';
        ctx.set('X-Content-Type-Options', 'nosniff');

        //NOTE: not using HTTP logger endpoint anymore, FD3 only
        if (error.type === 'entity.too.large') {
            const desc = `Entity too large for: ${reqPath}`;
            console.verbose.error(desc, methodName);
            ctx.status = 413;
            ctx.body = { error: desc };
        } else if (ctx.state.timeout) {
            const desc = `${prefix} Route timed out: ${reqPath}`;
            console.error(desc, methodName);
            ctx.status = 408;
            ctx.body = desc;
        } else if (error.message === 'Malicious Path' || error.message === 'failed to decode') {
            const desc = `${prefix} Malicious Path: ${reqPath}`;
            console.verbose.error(desc, methodName);
            ctx.status = 406;
            ctx.body = desc;
        } else if (error.message.match(/^Unexpected token .+ in JSON at position \d+$/)) {
            const desc = `${prefix} Invalid JSON for: ${reqPath}`;
            console.verbose.error(desc, methodName);
            ctx.status = 400;
            ctx.body = { error: desc };
        } else {
            const desc = [
                `${prefix} Internal Error.`,
                `Route: ${reqPath}`,
                `Message: ${error.message}`,
                'Make sure your txAdmin is updated.',
            ].join('\n');
            console.error(desc, methodName);
            console.verbose.dir(error);
            ctx.status = 500;
            ctx.body = desc;
        }
    }
}

export default topLevelMw;
