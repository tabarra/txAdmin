import type { RoomType } from "../webSocket";
import { DashboardDataEventType } from "@shared/socketioTypes";


/**
 * Returns the dashboard stats data
 */
const getInitialData = (): DashboardDataEventType => {
    const svRuntimeStats = txCore.metrics.svRuntime.getRecentStats();

    return {
        // joinLeaveTally30m: txCore.FxPlayerlist.joinLeaveTally,
        playerDrop: {
            summaryLast6h: txCore.metrics.playerDrop.getRecentDropTally(6),
        },
        svRuntime: {
            fxsMemory: svRuntimeStats.fxsMemory,
            nodeMemory: svRuntimeStats.nodeMemory,
            perfBoundaries: svRuntimeStats.perfBoundaries,
            perfBucketCounts: svRuntimeStats.perfBucketCounts,
        },
    }
}


/**
 * The room for the dashboard page.
 * It relays server performance stuff and drop reason categories.
 * 
 * NOTE: 
 * - active push event for only from Metrics.svRuntime
 * - Metrics.playerDrop does not push events, those are sent alongside the playerlist drop event
 *   which means that if accessing from NUI (ie not joining playerlist room), the chart will only be
 *   updated when the user refreshes the page.
 *   Same goes for "last 6h" not expiring old data if the server is not online pushing new perfs.
 */
export default {
    permission: true, //everyone can see it
    eventName: 'dashboard',
    cumulativeBuffer: false,
    outBuffer: null,
    initialData: () => {
        return getInitialData();
    },
} satisfies RoomType;
