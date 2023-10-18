const modulename = 'WebServer:PlayerPage';
import humanizeDuration from 'humanize-duration';
import { processActionList, processPlayerList } from './processor';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the action log, and the console log
 *
 * TODO: Return last players
 * FIXME: Add Caching ASAP. This is a _very_ expensive method.
 *
 * @param {object} ctx
 */
export default async function PlayerPage(ctx) {
    //Prepare dbo
    const dbo = globals.playerDatabase.getDb();

    const timeStart = new Date();
    const controllerConfigs = globals.playerDatabase.config;
    const queryLimits = {
        actions: 20,
        players: 30,
    };
    const respData = {
        headerTitle: 'Players',
        stats: getStats(),
        queryLimits,
        lastActions: await getLastActions(dbo, queryLimits.actions),
        lastPlayers: await getLastPlayers(dbo, queryLimits.players, ctx.txAdmin.playerlistManager),
        disableBans: !controllerConfigs.onJoinCheckBan,
        permsDisable: {
            ban: !ctx.admin.hasPermission('players.ban'),
            warn: !ctx.admin.hasPermission('players.warn'),
        },
    };

    //Output
    const timeElapsed = new Date() - timeStart;
    respData.message = `Executed in ${timeElapsed} ms`;
    return ctx.utils.render('main/playerList', respData);
};


/**
 * Get stats on actions and players
 */
function getStats() {
    try {
        const stats = globals.playerDatabase.getDatabaseStats();
        const playTimeSeconds = stats.playTime * 60 * 1000;
        let humanizeOptions = {
            round: true,
            units: ['y', 'd', 'h'],
            largest: 2,
            spacer: '',
            language: 'shortEn',
            languages: {
                shortEn: {
                    y: () => 'y',
                    d: () => 'd',
                    h: () => 'h',
                },
            },
        };
        const playTime = humanizeDuration(playTimeSeconds, humanizeOptions);

        return {
            players: stats.players.toLocaleString(),
            playTime: playTime,
            bans: stats.bans.toLocaleString(),
            warns: stats.warns.toLocaleString(),
            whitelists: stats.whitelists.toLocaleString(),
        };
    } catch (error) {
        const msg = `getStats failed with error: ${error.message}`;
        console.verbose.error(msg);
        return [];
    }
}


/**
 * Get the last actions from the end of the list.
 * NOTE: this is not being sorted by timestamp, we are assuming its ordered.
 * @param {object} dbo
 * @param {number} limit
 * @returns {array} array of processed actions, or [] on error
 */
async function getLastActions(dbo, limit) {
    try {
        const lastActions = await dbo.chain.get('actions')
            .takeRight(limit)
            .reverse()
            .cloneDeep()
            .value();
        return await processActionList(lastActions);
    } catch (error) {
        const msg = `getLastActions failed with error: ${error.message}`;
        console.verbose.error(msg);
        return [];
    }
}


/**
 * Get the last actions from the end of the list.
 * NOTE: this is not being sorted by timestamp, we are assuming its ordered.
 * @param {object} dbo
 * @param {number} limit
 * @returns {array} array of processed actions, or [] on error
 */
async function getLastPlayers(dbo, limit, playerlistManager) {
    try {
        const lastPlayers = await dbo.chain.get('players')
            .takeRight(limit)
            .reverse()
            .cloneDeep()
            .value();
        const activePlayersLicenses = playerlistManager.getPlayerList()
            .map((p) => p.license)
            .filter((l) => typeof l === 'string');
        return await processPlayerList(lastPlayers, activePlayersLicenses);
    } catch (error) {
        const msg = `getLastPlayers failed with error: ${error.message}`;
        console.verbose.error(msg);
        return [];
    }
}
