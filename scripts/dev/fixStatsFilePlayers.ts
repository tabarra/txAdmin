/**
 * Inject txTracker data (hourlyPlayers30d) into the stats_svRuntime.json file
 * 
 * NOTE: RENAME TO fixStatsFilePlayers.local.ts
 * NOTE: THEN RUN npx tsx scripts/dev/fixStatsFilePlayers.local.ts
 */
import fixStatsFilePlayers from "./fixStatsFilePlayers.code";
const sourceFileName = 'xxxxxx/txtracker/poc/xxxxx-hourlyPlayers30d.json'
const targetFileName = 'xxxxxx/txData/default/data/stats_svRuntime.json'
fixStatsFilePlayers(sourceFileName, targetFileName);
