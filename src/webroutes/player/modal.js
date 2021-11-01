//Requires
const modulename = 'WebServer:PlayerModal';
const cloneDeep = require('lodash/cloneDeep');
const dateFormat = require('dateformat');
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };


/**
 * Returns the data for the player's modal
 *
 * NOTE: sending license instead of id to be able to show data even for offline players
 *
 * @param {object} ctx
 */
module.exports = async function PlayerModal(ctx) {
    //Sanity check
    if (typeof ctx.params.reference === 'undefined') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    let reference = ctx.params.reference;
    const sess = ctx.nuiSession ?? ctx.session;

    //Helper function
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
            if (GlobalData.verbose) {
                logError('Error getting/processing player history');
                dir(error);
            }
            return [];
        }
    };

    //Infering filter type
    let filterFunction, filterType;
    if (/^[0-9A-Fa-f]{40}$/.test(reference)) {
        filterFunction = (player) => player.license === reference;
        filterType = 'license';
    } else if (/^\d{1,6}$/.test(reference)) {
        filterFunction = (player) => player.id === parseInt(reference, 10);
        filterType = 'id';
    } else if (/^\w{5}_\d{1,6}$/.test(reference)) {
        //FIXME: this was done way too late at night, please fix
        const cachedPlayer = globals.logger.server.cachedPlayers.get(reference.replace(/_/, '#'));
        if (!cachedPlayer) {
            return ctx.send({type: 'offline', message: 'Player not found in cache.'});
        }
        const pLicenseID = cachedPlayer.ids.find((id) => id.substring(0, 8) == 'license:');
        if (!pLicenseID) {
            return ctx.send({type: 'offline', message: 'Cached player has no license.'});
        }
        reference = pLicenseID.substring(8);
        filterFunction = (player) => player.license === reference;
        filterType = 'license';
    } else {
        throw new Error('Invalid reference type');
    }

    //Locating player
    const activePlayer = cloneDeep(globals.playerController.activePlayers).find(filterFunction);

    //Setting up output
    const controllerConfigs = globals.playerController.config;
    const out = {
        funcDisabled: {
            message: (activePlayer && ctx.utils.checkPermission('players.message', modulename, false)) ? '' : 'disabled',
            kick: (activePlayer && ctx.utils.checkPermission('players.kick', modulename, false)) ? '' : 'disabled',
            warn: (activePlayer && ctx.utils.checkPermission('players.warn', modulename, false)) ? '' : 'disabled',
            ban: !ctx.utils.checkPermission('players.ban', modulename, false) || !controllerConfigs.onJoinCheckBan,
        },
    };

    //If player is active or in the database
    let playerData;
    if (activePlayer) {
        if (GlobalData.verbose) dir(activePlayer); //DEBUG
        out.id = activePlayer.id;
        out.license = activePlayer.license;
        out.identifiers = activePlayer.identifiers;
        out.isTmp = activePlayer.isTmp;
        playerData = activePlayer;
    } else {
        if (filterType !== 'license') {
            return ctx.send({type: 'offline', message: 'Player offline, search by id is only available for online players.'});
        }
        //FIXME: for actions, look just for the license
        //TODO: when we start registering all associated identifiers, we could use that for the search
        let dbPlayer = await globals.playerController.getPlayer(reference);
        if (!dbPlayer) return ctx.send({type: 'offline', message: 'Player offline and not in database.'});
        if (GlobalData.verbose) dir(dbPlayer); //DEBUG

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
    out.sessionTime = humanizeDuration(sessionTime, {round: true, units: ['h', 'm']});
    if (playerData.isTmp) {
        out.playTime = '--';
        out.notesLog = 'unavailable for temporary players';
        out.notes = '';
    } else {
        const playTime = (playerData.playTime * 60 * 1000);
        out.playTime = humanizeDuration(playTime, {round: true, units: ['d', 'h', 'm']});
        if (playerData.notes.lastAdmin && playerData.notes.tsLastEdit) {
            let lastEditObj = new Date(playerData.notes.tsLastEdit * 1000);
            out.notesLog = `Last modified by ${playerData.notes.lastAdmin} at ${dateFormat(lastEditObj, 'longDate') }`;
        } else {
            out.notesLog = '';
        }
        out.notes = playerData.notes.text;
    }

    return ctx.send(out);
};
