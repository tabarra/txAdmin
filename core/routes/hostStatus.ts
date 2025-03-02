import type { InitializedCtx } from '@modules/WebServer/ctxTypes';


/**
 * Returns host status information
 */
export default async function HostStatus(ctx: InitializedCtx) {
    return ctx.send(txManager.hostStatus);
};
