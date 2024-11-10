import { DbInstance } from "../instance";
import consoleFactory from '@lib/console';
import { MultipleCounter } from '@modules/Metrics/statsUtils';
import { now } from '@lib/misc';
const console = consoleFactory('DatabaseDao');


/**
 * Data access object for collecting stats from the database.
 */
export default class StatsDao {
    constructor(private readonly db: DbInstance) { }

    private get dbo() {
        if (!this.db.obj || !this.db.isReady) throw new Error(`database not ready yet`);
        return this.db.obj;
    }

    private get chain() {
        if (!this.db.obj || !this.db.isReady) throw new Error(`database not ready yet`);
        return this.db.obj.chain;
    }


    /**
     * Returns players stats for the database (for Players page callouts)
     */
    getPlayersStats() {
        const oneDayAgo = now() - (24 * 60 * 60);
        const sevenDaysAgo = now() - (7 * 24 * 60 * 60);
        const startingValue = {
            total: 0,
            playedLast24h: 0,
            joinedLast24h: 0,
            joinedLast7d: 0,
        };
        const playerStats = this.chain.get('players')
            .reduce((acc, p, ind) => {
                acc.total++;
                if (p.tsLastConnection > oneDayAgo) acc.playedLast24h++;
                if (p.tsJoined > oneDayAgo) acc.joinedLast24h++;
                if (p.tsJoined > sevenDaysAgo) acc.joinedLast7d++;
                return acc;
            }, startingValue)
            .value();

        return playerStats;
    }


    /**
     * Returns players stats for the database (for Players page callouts)
     */
    getActionStats() {
        const sevenDaysAgo = now() - (7 * 24 * 60 * 60);
        const startingValue = {
            totalWarns: 0,
            warnsLast7d: 0,
            totalBans: 0,
            bansLast7d: 0,
            groupedByAdmins: new MultipleCounter(),
        };
        const actionStats = this.chain.get('actions')
            .reduce((acc, action, ind) => {
                if (action.type == 'ban') {
                    acc.totalBans++;
                    if (action.timestamp > sevenDaysAgo) acc.bansLast7d++;
                } else if (action.type == 'warn') {
                    acc.totalWarns++;
                    if (action.timestamp > sevenDaysAgo) acc.warnsLast7d++;
                }
                acc.groupedByAdmins.count(action.author);
                return acc;
            }, startingValue)
            .value();

        return {
            ...actionStats,
            groupedByAdmins: actionStats.groupedByAdmins.toJSON(),
        };
    }


    /**
     * Returns actions/players stats for the database
     * NOTE: used by diagnostics and reporting
     */
    getDatabaseStats() {
        const actionStats = this.chain.get('actions')
            .reduce((acc, a, ind) => {
                if (a.type == 'ban') {
                    acc.bans++;
                } else if (a.type == 'warn') {
                    acc.warns++;
                }
                return acc;
            }, { bans: 0, warns: 0 })
            .value();

        const playerStats = this.chain.get('players')
            .reduce((acc, p, ind) => {
                acc.players++;
                acc.playTime += p.playTime;
                if (p.tsWhitelisted) acc.whitelists++;
                return acc;
            }, { players: 0, playTime: 0, whitelists: 0 })
            .value();

        return { ...actionStats, ...playerStats }
    }
}
