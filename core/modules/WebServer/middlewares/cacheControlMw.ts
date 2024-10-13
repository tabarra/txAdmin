import type { CtxWithVars } from "../ctxTypes";
import type { Next } from 'koa';

/**
 * Middleware responsible for setting the cache control headers (disabling it entirely)
 * Since this comes after the koa-static middleware, it will only apply to the web routes
 * This is important because even our react index.html is actually SSR with auth context
 */
export default async function cacheControlMw(ctx: CtxWithVars, next: Next) {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
    ctx.set('Surrogate-Control', 'no-store');
    ctx.set('Expires', '0');
    ctx.set('Pragma', 'no-cache');

    return next();
};
