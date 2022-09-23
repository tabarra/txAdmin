const modulename = 'PlayerDatabase';
import humanizeDuration from 'humanize-duration'; //FIXME: remove, this controller is not the right place for interface stuff
import xssInstancer from '@core/extras/xss.js'; //FIXME: same as above
import consts from '@core/extras/consts';
import logger from '@core/extras/console.js';
import { convars, verbose } from '@core/globalData';
// eslint-disable-next-line no-unused-vars
import { SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH, Database } from './database.js';
import { genActionID, genWhitelistID } from './idGenerator';
import TxAdmin from '@core/txAdmin.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);
const xss = xssInstancer();

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };

//Consts
const validActions = ['ban', 'warn', 'whitelist'];


/**
 * Provide a central database for players, as well as assist with access control.
 *
 * FIXME: separate the player calls to another file somehow
 *
 * Database Structurure:
 *  - `players` table: index by license ID
 *      - license
 *      - name (overwrite on every update)
 *      - tsLastConnection  - Timestamp of the last connection
 *      - playTime - Online time counter in minutes
 *      - notes {
 *          text: string de tamanho máximo a ser definido,
 *          lastAdmin: username,
 *          tsLastEdit: timestamp,
 *      }
 *  - `actions`
 *      - id [X???-????]
 *      - identifiers [array]
 *      - playerName (player name, or false to imply it was performed on the identifiers only)
 *      - type [ban|warn|whitelist]
 *      - author (the admin name)
 *      - reason
 *      - timestamp
 *      - revocation: {
 *          timestamp: null,
 *          author: null,
 *      }
 *  - `pendingWL`
 *      - id [R####]
 *      - license
 *      - name
 *      - tsLastAttempt
 */
export type PlayerDbDataType = {
    license: string;
    name: string; //TODO: save displayName/pureName
    playTime: number;
    tsLastConnection: number;
    tsJoined: number;
    notes: {
        text: string;
        lastAdmin: string | null;
        tsLastEdit: number | null;
    };
}
type PlayerDbConfigType = {
    onJoinCheckBan: boolean;
    onJoinCheckWhitelist: boolean;
    minSessionTime: number;
    whitelistRejectionMessage: string;
    wipePendingWLOnStart: boolean;
}
export default class PlayerDatabase {
    db: Database;
    readonly #txAdmin: typeof TxAdmin;

    constructor(txAdmin: typeof TxAdmin, public config: PlayerDbConfigType) {
        this.#txAdmin = txAdmin;
        this.db = new Database(config.wipePendingWLOnStart);
    }

    /**
     * Returns the entire lowdb object. Please be careful with it :)
     *
     * TODO: perhaps add a .cloneDeep()? Might cause some performance issues tho
     *
     * @returns {object} lodash database
     */
    getDb() {
        throw new Error(`dev note: not validated yet`);
        return this.db.obj;
    }


    /**
     * Searches for a player in the database by the license, returns null if not found or false in case of error
     */
    getPlayerData(license: string): PlayerDbDataType | null {
        if (!/[0-9A-Fa-f]{40}/.test(license)) {
            throw new Error('Invalid reference type');
        }

        //Performing search
        const p = this.db.obj.get('players')
            .find({ license })
            .cloneDeep()
            .value();
        return (typeof p === 'undefined') ? null : p;
    }


    /**
     * Register a player to the database
     */
    registerPlayer(player: PlayerDbDataType) {
        this.db.writeFlag(SAVE_PRIORITY_LOW);
        this.db.obj.get('players')
            .push(player)
            .value();
    }


    /**
     * Updates a player setting assigning srcData props to the database player
     */
    updatePlayer(license: string, srcData: Exclude<object, null>): PlayerDbDataType {
        this.db.writeFlag(SAVE_PRIORITY_LOW);
        return this.db.obj.get('players')
            .find({ license })
            .assign(srcData)
            .cloneDeep()
            .value();
    }


    /**
     * Searches for a registered action in the database by a list of identifiers and optional filters
     * Usage example: getRegisteredActions(['license:xxx'], {type: 'ban', revocation.timestamp: null})
     *
     * NOTE: I haven't actually benchmarked to make sure passing the filter first increases the performance
     *
     * @param {array} idArray identifiers array
     * @param {object} filter lodash-compatible filter object
     * @returns {array|error} array of actions, or, throws on error
     */
    async getRegisteredActions(idArray, filter = {}) {
        throw new Error(`not ready`);
        if (!Array.isArray(idArray)) throw new Error('Identifiers should be an array');
        try {
            return await this.db.obj.get('actions')
                .filter(filter)
                .filter((a) => idArray.some((fi) => a.identifiers.includes(fi)))
                .cloneDeep()
                .value();
        } catch (error) {
            const msg = `Failed to search for a registered action database with error: ${error.message}`;
            if (verbose) logError(msg);
            throw new Error(msg);
        }
    }


    /**
     * Processes an playerConnecting validation request
     *
     * TODO: improve ban message to be more verbose
     *
     * FIXME: this probably shouldn't be inside playerController
     *
     * @param {array} idArray identifiers array
     * @param {string} name player name
     * @returns {object} {allow: bool, reason: string}, or throws on error
     */
    async checkPlayerJoin(idArray, playerName) {
        throw new Error(`not ready`);
        //Check if required
        if (!this.config.onJoinCheckBan && !this.config.onJoinCheckWhitelist) {
            return { allow: true, reason: 'checks disabled' };
        }

        //DEBUG: save join log
        const toLog = {
            ts: Date.now(),
            playerName,
            idArray,
        };
        globals.databus.joinCheckHistory.push(toLog);
        if (globals.databus.joinCheckHistory.length > 25) globals.databus.joinCheckHistory.shift();

        //Sanity checks
        if (typeof playerName !== 'string') throw new Error('playerName should be an string.');
        if (!Array.isArray(idArray)) throw new Error('Identifiers should be an array.');
        idArray = idArray.filter((id) => {
            return Object.values(consts.validIdentifiers).some((vf) => vf.test(id));
        });
        if (idArray.length < 1) throw new Error('Identifiers array must contain at least 1 valid identifier.');

        try {
            //Prepare & query
            const ts = now();
            const filter = (x) => {
                return (
                    (x.type == 'ban' || x.type == 'whitelist')
                    && (!x.expiration || x.expiration > ts)
                    && (!x.revocation.timestamp)
                );
            };
            const hist = await this.getRegisteredActions(idArray, filter);

            //Check ban
            if (this.config.onJoinCheckBan) {
                const ban = hist.find((a) => a.type == 'ban');
                if (ban) {
                    let msg;
                    const tOptions = {
                        id: ban.id,
                        reason: xss(ban.reason),
                        author: xss(ban.author),
                    };
                    if (ban.expiration) {
                        const humanizeOptions = {
                            language: globals.translator.t('$meta.humanizer_language'),
                            round: true,
                            units: ['d', 'h'],
                        };
                        tOptions.expiration = humanizeDuration((ban.expiration - ts) * 1000, humanizeOptions);
                        msg = globals.translator.t('ban_messages.reject_temporary', tOptions);
                    } else {
                        msg = globals.translator.t('ban_messages.reject_permanent', tOptions);
                    }

                    return { allow: false, reason: msg };
                }
            }

            //Check whitelist
            if (this.config.onJoinCheckWhitelist) {
                const wl = hist.find((a) => a.type == 'whitelist');
                if (!wl) {
                    //Get license
                    let license = idArray.find((id) => id.substring(0, 8) == 'license:');
                    if (!license) return { allow: false, reason: 'the whitelist module requires a license identifier.' };
                    license = license.substring(8);
                    //Check for pending WL requests
                    const pending = await this.db.obj.get('pendingWL').find({ license: license }).value();
                    let whitelistID;
                    if (pending) {
                        pending.name = playerName;
                        pending.tsLastAttempt = now();
                        whitelistID = pending.id;
                    } else {
                        whitelistID = await genWhitelistID(this.db.obj);
                        const toDB = {
                            id: whitelistID,
                            name: playerName,
                            license: license,
                            tsLastAttempt: now(),
                        };
                        await this.db.obj.get('pendingWL').push(toDB).value();
                    }
                    this.db.writeFlag(SAVE_PRIORITY_LOW);

                    //Clean rejection message
                    const xssRejectMessage = xssInstancer({
                        strong: [],
                        id: [],
                    });
                    const reason = xssRejectMessage(this.config.whitelistRejectionMessage)
                        .replace(/<\/?strong>/g, '')
                        .replace(/<id>/g, whitelistID);
                    return { allow: false, reason };
                }
            }

            return { allow: true, reason: null };
        } catch (error) {
            const msg = `Failed to check whitelist/blacklist: ${error.message}`;
            logError(msg);
            if (verbose) dir(error);
            return { allow: false, reason: msg };
        }
    }


    /**
     * Registers an action (ban, warn, whitelist)
     * @param {array|number} reference identifiers array or server id
     * @param {string} type [ban|warn|whitelist]
     * @param {string} author admin name
     * @param {string} reason reason
     * @param {number|false} expiration reason
     * @param {string|false} playerName the name of the player (for UX purposes only)
     * @returns {string} action ID, or throws if on error or ID not found
     */
    async registerAction(reference, type, author, reason = null, expiration = false, playerName = false) {
        throw new Error(`not ready`);
        //FIXME: REMINDER THAT LICENSE IS NOT UNIQUE IN THE SERVER
        //Sanity check
        const timestamp = now();
        if (!validActions.includes(type)) throw new Error('Invalid action type.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (reason !== null && (typeof reason !== 'string' || !reason.length)) throw new Error('Invalid reason.');
        if (expiration !== false && (typeof expiration !== 'number')) throw new Error('Invalid expiration.');
        if (playerName !== false && (typeof playerName !== 'string' || !playerName.length)) throw new Error('Invalid playerName.');

        //Processes target reference
        let identifiers;
        if (Array.isArray(reference)) {
            if (!reference.length) throw new Error('You must send at least one identifier');
            const invalids = reference.filter((id) => {
                return (typeof id !== 'string') || !Object.values(consts.validIdentifiers).some((vf) => vf.test(id));
            });
            if (invalids.length) {
                throw new Error('Invalid identifiers: ' + invalids.join(', '));
            } else {
                identifiers = reference;
            }
        } else if (typeof reference == 'number') {
            const player = this.activePlayers.find((p) => p.id === reference);
            if (!player) throw new Error('Player disconnected.');
            if (!player.identifiers.length) throw new Error('Player has no identifiers.'); //sanity check
            identifiers = player.identifiers;
            playerName = player.name;
        } else {
            throw new Error(`Reference expected to be an array of strings or ID int. Received '${typeof target}'.`);
        }

        //Saves it to the database
        try {
            const actionID = await genActionID(this.db.obj, type);
            const toDB = {
                id: actionID,
                type,
                author,
                reason,
                expiration,
                timestamp,
                playerName,
                identifiers,
                revocation: {
                    timestamp: null,
                    author: null,
                },
            };
            await this.db.obj.get('actions')
                .push(toDB)
                .value();
            this.db.writeFlag(SAVE_PRIORITY_HIGH);
            return actionID;
        } catch (error) {
            let msg = `Failed to register event to database with message: ${error.message}`;
            logError(msg);
            if (verbose) dir(error);
            throw new Error(msg);
        }
    }


    /**
     * Revoke an action (ban, warn, whitelist)
     * @param {string} action_id action id
     * @param {string} author admin name
     * @param {array} allowedTypes array containing the types of actions this admin can revoke
     * @returns {string} null, error message string, or throws if something goes wrong
     */
    async revokeAction(action_id, author, allowedTypes = true) {
        throw new Error(`not ready`);
        //FIXME: REMINDER THAT LICENSE IS NOT UNIQUE IN THE SERVER
        if (typeof action_id !== 'string' || !action_id.length) throw new Error('Invalid action_id.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (allowedTypes !== true && !Array.isArray(allowedTypes)) throw new Error('Invalid allowedTypes.');
        try {
            const action = await this.db.obj.get('actions')
                .find({ id: action_id })
                .value();
            if (action) {
                if (allowedTypes !== true && !allowedTypes.includes(action.type)) {
                    return 'you do not have permission to revoke this action';
                }
                action.revocation = {
                    timestamp: now(),
                    author,
                };
                this.db.writeFlag(SAVE_PRIORITY_HIGH);
                return null;
            } else {
                return 'action not found';
            }
        } catch (error) {
            const msg = `Failed to revoke action with message: ${error.message}`;
            logError(msg);
            if (verbose) dir(error);
            throw new Error(msg);
        }
    }


    /**
     * Whitelists a player from it's license or wl pending id
     *
     * NOTE: I'm only getting the first matched pending, but removing all matching
     * NOTE: maybe I should add a trycatch inside here
     *
     * @param {string} reference "license:" prefixed license or pending id
     * @param {string} author admin name
     * @returns {string} action ID, or throws if ID not found or error
     */
    async approveWhitelist(reference, author) {
        throw new Error(`not ready`);
        //FIXME: REMINDER THAT LICENSE IS NOT UNIQUE IN THE SERVER
        //Sanity check & validation
        if (typeof reference !== 'string' || typeof author !== 'string') {
            throw new Error('Reference and Author should be strings');
        }

        //Localizing pending request
        let pendingFilter;
        let saveReference;
        let playerName = false;
        if (/[0-9A-Fa-f]{40}/.test(reference)) {
            pendingFilter = { license: reference };
            saveReference = [`license:${reference}`];
            const pending = await this.db.obj.get('pendingWL').find(pendingFilter).value();
            if (pending) playerName = pending.name;
        } else if (consts.regexWhitelistReqID.test(reference)) {
            pendingFilter = { id: reference };
            const pending = await this.db.obj.get('pendingWL').find(pendingFilter).value();
            if (!pending) throw new Error('Pending ID not found in database');
            saveReference = [`license:${pending.license}`];
            playerName = pending.name;
        } else {
            throw new Error('Invalid reference type');
        }

        //Register whitelist
        const actionID = await this.registerAction(saveReference, 'whitelist', author, null, false, playerName);
        if (!actionID) throw new Error('Failed to whitelist player');
        this.db.writeFlag(SAVE_PRIORITY_HIGH);

        //Remove from the pending list
        if (playerName) {
            await this.db.obj.get('pendingWL').remove(pendingFilter).value();
        }

        return actionID;
    }


    /**
     * Saves a player notes and returns true/false
     * Usage example: setPlayerNote('xxx', 'super awesome player', 'tabarra')
     *
     * NOTE: Setting writePending here won't do anything. Don't try it...
     *
     * @param {string} license
     * @param {string} note
     * @param {string} author
     * @returns {boolean}
     */
    async setPlayerNote(license, note, author) {
        throw new Error(`not ready`);
        //HACK isso agora vai dar commit imediatamente, target direto o banco
        //FIXME: REMINDER THAT LICENSE IS NOT UNIQUE IN THE SERVER
        try {
            //Search player
            let target;
            let ap = this.activePlayers.find((p) => p.license === license);
            if (ap) {
                target = ap;
            } else {
                let dbp = await this.db.obj.get('players').find({ license: license }).value();
                if (!dbp) return false;
                target = dbp;
            }

            //Add note and set pending flag
            target.notes = {
                text: note,
                lastAdmin: author,
                tsLastEdit: now(),
            };

            return true;
        } catch (error) {
            if (verbose) logError(`Failed to search for a registered action database with error: ${error.message}`);
            return false;
        }
    }


    /**
     * Cleans the database by removing every entry that matches the provided filter function.
     *
     * @param {String} table identifiers array
     * @param {function} filter lodash-compatible filter function
     * @returns {number|error} number of removed items
     */
    async cleanDatabase(tableName, filterFunc) {
        if (tableName !== 'players' && tableName !== 'actions') throw new Error('Unknown tableName.');
        if (typeof filterFunc !== 'function') throw new Error('filterFunc must be a function.');

        try {
            const removed = await this.db.obj.get(tableName)
                .remove(filterFunc)
                .value();
            return removed.length;
        } catch (error) {
            const msg = `Failed to clean database with error: ${error.message}`;
            if (verbose) logError(msg);
            throw new Error(msg);
        }
    }
};
