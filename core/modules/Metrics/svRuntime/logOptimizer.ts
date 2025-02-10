import { STATS_LOG_SIZE_LIMIT, STATS_RESOLUTION_TABLE } from "./config";
import type { SvRtLogType } from "./perfSchemas";

//Consts
const YIELD_INTERVAL = 100;


/**
 * Optimizes (in place) the stats log by removing old data and combining snaps to match the resolution
 */
export const optimizeSvRuntimeLog = async (statsLog: SvRtLogType) => {
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
