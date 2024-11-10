import { ValuesType } from "utility-types";


/**
 * Configs
 */
const minutesMs = 60 * 1000;
const hoursMs = 60 * minutesMs;
export const PERF_DATA_BUCKET_COUNT = 15;
export const PERF_DATA_MIN_TICKS = 600; //less than that and the data is not reliable - 30s for svMain
export const PERF_DATA_INITIAL_RESOLUTION = 5 * minutesMs;
export const STATS_RESOLUTION_TABLE = [
    //00~12h =  5min = 12/h = 144 snaps
    //12~24h = 15min =  4/h =  48 snaps
    //24~96h = 30min =  2/h = 144 snaps
    { maxAge: 12 * hoursMs, resolution: PERF_DATA_INITIAL_RESOLUTION },
    { maxAge: 24 * hoursMs, resolution: 15 * minutesMs },
    { maxAge: 96 * hoursMs, resolution: 30 * minutesMs },
];
export const STATS_LOG_SIZE_LIMIT = 720; //144+48+144 (max data snaps) + 384 (1 reboot every 30 mins)
export const PERF_DATA_THREAD_NAMES = ['svNetwork', 'svSync', 'svMain'] as const;
export type SvRtPerfThreadNamesType = ValuesType<typeof PERF_DATA_THREAD_NAMES>;


// // @ts-ignore Typescript Pseudocode:

// type SnapType = {
//     dateStart: Date;
//     dateEnd: Date;
//     value: number;
// }

// const snapshots: SnapType[] = [/*data*/];
// const fixedDesiredResolution = 15 * 60 * 1000; // 15 minutes in milliseconds
// const processedSnapshots: SnapType[] = [];
// let pendingSnapshots: SnapType[] = [];
// for (const snap of snapshots) {
//     if (pendingSnapshots.length === 0) {
//         pendingSnapshots.push(snap);
//         continue;
//     }

//     const pendingStart = pendingSnapshots[0].dateStart;
//     const currSnapEnd = snap.dateEnd;
//     const totalDuration = currSnapEnd.getTime() - pendingStart.getTime();
//     if (totalDuration <= fixedDesiredResolution) {
//         pendingSnapshots.push(snap);
//     } else {
//         const sumValue = pendingSnapshots.reduce((acc, curr) => {
//             const snapDuration = curr.dateEnd.getTime() - curr.dateStart.getTime();
//             return acc + curr.value * snapDuration;
//         }, 0);
//         processedSnapshots.push({
//             dateStart: pendingStart,
//             dateEnd: currSnapEnd,
//             value: sumValue / totalDuration,
//         });
//         pendingSnapshots = [];
//     }
// }

// //processedSnapshots contains the snapshots with the fixed resolution
