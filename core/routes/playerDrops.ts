const modulename = 'WebServer:PlayerDrops';
import { PDLHourlyRawType } from '@modules/Metrics/playerDrop/playerDropSchemas';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { DeepReadonly } from 'utility-types';
import { z } from 'zod';
const console = consoleFactory(modulename);


//Types & validation
const querySchema = z.object({
    detailedWindow: z.string().optional(),
    detailedDaysAgo: z.string().optional(),
});

const SUMMARY_DEFAULT_HOURS = 14 * 24;
const DETAILED_DEFAULT_HOURS = 7 * 24;

export type PlayerDropsSummaryHour = {
    hour: string;
    changes: number;
    dropTypes: [reason: string, count: number][];
}

//NOTE: cumulative, not hourly
export type PlayerDropsDetailedWindow = Omit<PDLHourlyRawType, 'hour'>;

export type PlayerDropsApiSuccessResp = {
    ts: number;
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
 * Returns the data required to build the player drops page, both summary timeline and detailed drilldown
 */
export default async function playerDrops(ctx: AuthedCtx) {
    const sendTypedResp = (data: PlayerDropsApiResp) => ctx.send(data);
    const schemaRes = querySchema.safeParse(ctx.request.query);
    if (!schemaRes.success) {
        return sendTypedResp({
            fail_reason: `Invalid request query: ${schemaRes.error.message}`,
        });
    }
    const { detailedWindow, detailedDaysAgo } = schemaRes.data;
    const lookupTs = Date.now();

    //Get the summary for the last 2 weeks
    const summary = txCore.metrics.playerDrop.getRecentSummary(SUMMARY_DEFAULT_HOURS);

    //Get the detailed data for the requested window or 1d by default
    let detailedWindowStart, detailedWindowEnd;
    if (detailedWindow) {
        try {
            const [windowStartStr, windowEndStr] = detailedWindow.split(',');
            detailedWindowStart = new Date(windowStartStr).getTime();
            detailedWindowEnd = Math.min(
                lookupTs,
                new Date(windowEndStr).getTime(),
            );
        } catch (error) {
            return sendTypedResp({
                fail_reason: `Invalid date format: ${(error as Error).message}`,
            })
        }
    } else {
        let windowHours = DETAILED_DEFAULT_HOURS;
        if (detailedDaysAgo) {
            const daysAgo = parseInt(detailedDaysAgo);
            if (!isNaN(daysAgo) && daysAgo >= 1 && daysAgo <= 14) {
                windowHours = daysAgo * 24;
            }
        }

        const startDate = new Date();
        detailedWindowStart = startDate.setHours(startDate.getHours() - (windowHours), 0, 0, 0);
        detailedWindowEnd = lookupTs;
    }
    const detailed = txCore.metrics.playerDrop.getWindowData(detailedWindowStart, detailedWindowEnd);

    return sendTypedResp({
        ts: lookupTs,
        summary,
        detailed: {
            windowStart: new Date(detailedWindowStart).toISOString(),
            windowEnd: new Date(detailedWindowEnd).toISOString(),
            windowData: detailed,
        }
    });
};
