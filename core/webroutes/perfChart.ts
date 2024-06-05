const modulename = 'WebServer:PerfChart';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { SvRtLogFilteredType, SvRtPerfBoundariesType } from '@core/components/StatsManager/svRuntime/perfSchemas';
import { z } from 'zod';
const console = consoleFactory(modulename);


//Types
export type PerfChartApiErrorResp = {
    error: string;
};
export type PerfChartApiSuccessResp = {
    boundaries: SvRtPerfBoundariesType;
    threadPerfLog: SvRtLogFilteredType;
}
export type PerfChartApiResp = PerfChartApiErrorResp | PerfChartApiSuccessResp;

//Schema
const paramsSchema = z.object({ thread: z.string() });
const requiredMinDataAge = 30 * 60 * 1000; //30 mins

/**
 * Returns the data required to build the dashboard performance chart of a specific thread
 */
export default async function perfChart(ctx: AuthedCtx) {
    const sendTypedResp = (data: PerfChartApiResp) => ctx.send(data);

    //Validating input
    const schemaRes = paramsSchema.safeParse(ctx.request.params);
    if (!schemaRes.success) {
        return sendTypedResp({ error: 'bad_request' });
    }

    const chartData = ctx.txAdmin.statsManager.svRuntime.getChartData(schemaRes.data.thread);
    if ('error' in chartData) {
        return sendTypedResp(chartData);
    }

    const oldestDataLogged = chartData.threadPerfLog.find((log) => log.type === 'data');
    if (!oldestDataLogged) {
        return sendTypedResp({
            error: 'not_enough_data',
        });
    } else if (oldestDataLogged.ts > Date.now() - requiredMinDataAge) {
        return sendTypedResp({
            error: 'not_enough_data',
        });
    }
    return sendTypedResp(chartData);
};
