const modulename = 'WebServer:PlayerDrops';
import { PDLHourlyRawType } from '@core/components/StatsManager/playerDrop/playerDropSchemas';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { DeepReadonly } from 'utility-types';
import { z } from 'zod';
const console = consoleFactory(modulename);


//Types & validation
const querySchema = z.object({
    detailedWindow: z.string().optional(),
});

export type PlayerDropsSummaryHour = {
    hour: string;
    hasChanges: boolean;
    dropTypes: [reason: string, count: number][];
    crashes: number;
}

//NOTE: cumulative, not hourly
export type PlayerDropsDetailedWindow = Omit<PDLHourlyRawType, 'hour'>;

export type PlayerDropsApiSuccessResp = {
    summary: PlayerDropsSummaryHour[];
    detailed: {
        windowStart: string;
        windowEnd: string;
        windowData: PlayerDropsDetailedWindow;
    };
};
export type PlayerDropsApiErrorResp = {
    fail_reason: string;
};

export type PlayerDropsApiResp = DeepReadonly<PlayerDropsApiSuccessResp | PlayerDropsApiErrorResp>;


/**
 * Returns the data required to build the dashboard performance chart of a specific thread
 */
export default async function playerDrops(ctx: AuthedCtx) {
    const sendTypedResp = (data: PlayerDropsApiResp) => ctx.send(data);
    const schemaRes = querySchema.safeParse(ctx.request.query);
    if (!schemaRes.success) {
        return sendTypedResp({
            fail_reason: `Invalid request query: ${schemaRes.error.message}`,
        });
    }
    const { detailedWindow } = schemaRes.data;

    //Get the summary for the last 2 weeks
    const summary = ctx.txAdmin.statsManager.playerDrop.getRecentSummary(24 * 14);

    //Get the detailed data for the requested window or 1d by default
    let detailedWindowStart, detailedWindowEnd;
    if (detailedWindow) {
        try {
            const [windowStartStr, windowEndStr] = detailedWindow.split(',');
            detailedWindowStart = (new Date(windowStartStr)).setUTCMinutes(0, 0, 0);
            detailedWindowEnd = (new Date(windowEndStr)).setUTCMinutes(0, 0, 0);
        } catch (error) {
            return sendTypedResp({
                fail_reason: `Invalid date format: ${(error as Error).message}`,
            })
        }
    } else {
        detailedWindowStart = (new Date).setUTCMinutes(0, 0, 0) - (24 * 60 * 60 * 1000) - 1;
        detailedWindowEnd = (new Date).setUTCMinutes(0, 0, 0) - 1;
    }
    const detailed = ctx.txAdmin.statsManager.playerDrop.getWindowData(detailedWindowStart, detailedWindowEnd);

    return sendTypedResp({
        summary,
        detailed: {
            windowStart: new Date(detailedWindowStart).toISOString(),
            windowEnd: new Date(detailedWindowEnd).toISOString(),
            windowData: detailed,
        }
    });
};
