/**
 * This script is used to merge multiple stats_playerDrop files into a single file with the last 336 hours of data.
 * 
 * NOTE: RENAME TO makeOldStatsFile.local.ts
 * NOTE: THEN RUN npx tsx scripts/dev/makeOldStatsFile.local.ts
 */
import makeOldStatsFile from "./makeOldStatsFile.code";
//Extract all crashes from all files
const sourceFiles = [
    'xxxxx/stats_playerDrop.json',
    'xxxxx/stats_playerDrop(1).json',
    'xxxxx/stats_playerDrop(2).json',
    'xxxxx/stats_playerDrop(3).json',
];

const formattedTimestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const targetFileName = `xxxxxxxx/txData/default/data/stats_playerDrop.json.${formattedTimestamp}`;
makeOldStatsFile(sourceFiles, targetFileName);
