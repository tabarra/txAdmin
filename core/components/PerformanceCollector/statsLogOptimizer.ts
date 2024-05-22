import type { SSLogType } from "./perfSchemas";

//Consts
const minutesMs = 60 * 1000;
const hoursMs = 60 * minutesMs;
const STATS_RESOLUTION_TABLE = [
     //00~12h =  5m = 12/h = 144 snaps
     //12~24h = 15m =  4/h =  48 snaps
     //24~96h = 30m =  2/h = 144 snaps
     { maxAge: 12 * hoursMs, resolution: 5 * minutesMs },
     { maxAge: 24 * hoursMs, resolution: 15 * minutesMs },
     { maxAge: 96 * hoursMs, resolution: 30 * minutesMs },
];
const STATS_LOG_SIZE_LIMIT = 720; //144+48+144 (max data snaps) + 384 (1 reboot every 30 mins)


/**
 * Optimizes (in place) the stats log by removing old data and combining snaps to match the resolution
 */
export const optimizeStatsLog = (statsLog: SSLogType) => {
     //FIXME: write code
}
