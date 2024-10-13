const modulename = 'SocketRoom:Status';
import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";
import consoleFactory from '@extras/console';
import { DashboardDataEventType } from "@shared/socketioTypes";
const console = consoleFactory(modulename);


/**
 * Returns the dashboard stats data
 */
const getInitialData = (txAdmin: TxAdmin): DashboardDataEventType => {
    const svRuntimeStats = txAdmin.statsManager.svRuntime.getRecentStats();

    return {
        // joinLeaveTally30m: txAdmin.playerlistManager.joinLeaveTally,
        playerDrop: {
            summaryLast6h: txAdmin.statsManager.playerDrop.getRecentDropTally(6),
        },
        svRuntime: {
            fxsMemory: svRuntimeStats.fxsMemory,
            nodeMemory: svRuntimeStats.nodeMemory,
            perfBoundaries: svRuntimeStats.perfBoundaries,
            perfBucketCounts: svRuntimeStats.perfBucketCounts,
            //NOTE: numbers from fivem/code/components/citizen-server-impl/src/GameServer.cpp
            perfMinTickTime: {
                svMain: (1000 / 20) / 1000,
                // svNetwork: (1000 / 100) / 1000,
                // svSync: (1000 / 120) / 1000,

                //NOTE: faking the numbers due to the colors being wrong in the chart
                svNetwork: (1000 / 40) / 1000,
                svSync: (1000 / 40) / 1000,
            },
        },
    }
}


/**
 * The room for the dashboard page.
 * It relays server performance stuff and drop reason categories.
 * 
 * NOTE: 
 * - active push event for only from StatsManager.svRuntime
 * - StatsManager.playerDrop does not push events, those are sent alongside the playerlist drop event
 *   which means that if accessing from NUI (ie not joining playerlist room), the chart will only be
 *   updated when the user refreshes the page.
 *   Same goes for "last 6h" not expiring old data if the server is not online pushing new perfs.
 */
export default (txAdmin: TxAdmin): RoomType => ({
    permission: true, //everyone can see it
    eventName: 'dashboard',
    cumulativeBuffer: false,
    outBuffer: null,
    initialData: () => {
        return getInitialData(txAdmin);
    },
})
