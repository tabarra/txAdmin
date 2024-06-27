const modulename = 'WebServer:PerfChart';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { DeepReadonly } from 'utility-types';
const console = consoleFactory(modulename);


//Types
export type PlayerCrashesApiErrorResp = {
    fail_reason: string;
};
export type PlayerCrashesApiSuccessResp = [reason: string, count: number][];
export type PlayerCrashesApiResp = DeepReadonly<PlayerCrashesApiErrorResp | PlayerCrashesApiSuccessResp>;


/**
 * Returns the data required to build the dashboard performance chart of a specific thread
 */
export default async function perfChart(ctx: AuthedCtx) {
    const sendTypedResp = (data: PlayerCrashesApiResp) => ctx.send(data);

    const crashSummary = ctx.txAdmin.statsManager.playerDrop.getRecentCrashes(24);

    return sendTypedResp(crashSummary);
};
