import { STATS_LOG_SIZE_LIMIT, STATS_RESOLUTION_TABLE } from "./index";
import type { SSLogType } from "./perfSchemas";

//Consts
const YIELD_INTERVAL = 100;


/**
 * Optimizes (in place) the stats log by removing old data and combining snaps to match the resolution
 */
export const optimizeStatsLog = async (statsLog: SSLogType) => {
     statsLog.splice(0, statsLog.length - STATS_LOG_SIZE_LIMIT);
     for (let i = 0; i < statsLog.length; i++) {
          //FIXME: write code
          //FIXME: somehow prevent recombining the 0~12h snaps

          // Yield every 100 iterations
          if (i % YIELD_INTERVAL === 0) {
               await new Promise((resolve) => setImmediate(resolve));
          }
     }
}
