const modulename = 'WebServer:PlayerModal';
import { cloneDeep } from 'lodash-es';
import dateFormat from 'dateformat';
import humanizeDuration from 'humanize-duration';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData.ts';
import playerResolver from '@core/playerLogic/playerResolver';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };
const getHistory = async (idArray) => {
    try {
        //TODO: if it was today, show time instead
        const hist = await globals.playerController.getRegisteredActions(idArray);
        return hist.map((log) => {
            const out = {
                action: log.type.toUpperCase(),
                date: dateFormat(new Date(log.timestamp * 1000), 'dd/mm'),
                reason: log.reason,
                author: log.author,
            };
            if (log.revocation.timestamp) {
                out.color = 'dark';
                out.action = `${out.action}-REVOKED`;
            } else if (log.type == 'ban') {
                out.color = 'danger';
            } else if (log.type == 'warn') {
                out.color = 'warning';
            } else if (log.type == 'whitelist') {
                out.color = 'success';
            } else {
                out.color = 'secondary';
            }
            return out;
        });
    } catch (error) {
        if (verbose) {
            logError('Error getting/processing player history');
            dir(error);
        }
        return [];
    }
};

//DEBUG
const { Console } = require('node:console');
const ogConsole = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});


/**
 * Returns the data for the player's modal
 *
 * NOTE: sending license instead of id to be able to show data even for offline players
 *
 * @param {object} ctx
 */
export default async function PlayerModal(ctx) {
    //Sanity check
    if (typeof ctx.query === 'undefined') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const { mutex, netid, license } = ctx.query;

    //Finding the player
    let player;
    try {
        const res = playerResolver(mutex, parseInt(netid), license);
        if (res.error) return ctx.send({ type: 'offline', message: res.error });
        player = res.player;
    } catch (error) {
        return ctx.send({ type: 'danger', message: error.message });
    }

    ogConsole.dir(player);



    return ctx.send({ type: 'danger', message: 'not implemented' });

    //Setting up output
    const controllerConfigs = globals.playerController.config;
    const out = {
        //FIXME: this should not come from the route itself
        funcDisabled: {
            message: (player && ctx.utils.checkPermission('players.message', modulename, false)) ? '' : 'disabled',
            kick: (player && ctx.utils.checkPermission('players.kick', modulename, false)) ? '' : 'disabled',
            warn: (player && ctx.utils.checkPermission('players.warn', modulename, false)) ? '' : 'disabled',
            ban: !ctx.utils.checkPermission('players.ban', modulename, false) || !controllerConfigs.onJoinCheckBan,
        },
    };

    //If player is active or in the database
    let playerData;
    if (player) {
        if (verbose) dir(player);
        out.id = player.id;
        out.license = player.license;
        out.identifiers = player.identifiers;
        out.isTmp = player.isTmp;
        playerData = player;
    } else {
        if (filterType !== 'license') {
            return ctx.send({ type: 'offline', message: 'Player offline, search by id is only available for online players.' });
        }
        //FIXME: for actions, look just for the license
        //TODO: when we start registering all associated identifiers, we could use that for the search
        let dbPlayer = await globals.playerController.getPlayer(reference);
        if (!dbPlayer) return ctx.send({ type: 'offline', message: 'Player offline and not in database.' });
        if (verbose) dir(dbPlayer); //DEBUG

        out.id = false;
        out.license = reference;
        out.identifiers = [`license:${reference}`];
        out.isTmp = false;
        playerData = dbPlayer;
    }

    //Preparing output
    out.name = playerData.name;
    out.actionHistory = await getHistory(out.identifiers);
    const joinDateObj = new Date(playerData.tsJoined * 1000);
    out.joinDate = dateFormat(joinDateObj, 'longDate') + ' - ' + dateFormat(joinDateObj, 'isoTime');
    const sessionTime = (now() - playerData.tsConnected) * 1000;
    out.sessionTime = humanizeDuration(sessionTime, { round: true, units: ['h', 'm'] });
    if (playerData.isTmp) {
        out.playTime = '--';
        out.notesLog = 'unavailable for temporary players';
        out.notes = '';
    } else {
        const playTime = (playerData.playTime * 60 * 1000);
        out.playTime = humanizeDuration(playTime, { round: true, units: ['d', 'h', 'm'] });
        if (playerData.notes.lastAdmin && playerData.notes.tsLastEdit) {
            let lastEditObj = new Date(playerData.notes.tsLastEdit * 1000);
            out.notesLog = `Last modified by ${playerData.notes.lastAdmin} at ${dateFormat(lastEditObj, 'longDate')}`;
        } else {
            out.notesLog = '';
        }
        out.notes = playerData.notes.text;
    }

    return ctx.send(out);
};
