const modulename = 'PlayerDatabase';
import humanizeDuration from 'humanize-duration'; //FIXME: remove, this controller is not the right place for interface stuff
import xssInstancer from '@core/extras/xss.js'; //FIXME: same as above
import consts from '@core/extras/consts';
import logger from '@core/extras/console.js';
import { convars, verbose } from '@core/globalData';
// eslint-disable-next-line no-unused-vars
import { SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH, Database } from './database';
import { genActionID } from './idGenerator';
import TxAdmin from '@core/txAdmin.js';
import { DatabaseActionType, DatabasePlayerType, DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from './databaseTypes';
import { cloneDeep } from 'lodash-es';
const { dir, log, logOk, logWarn, logError } = logger(modulename);
const xss = xssInstancer();

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };

//Consts
const validActions = ['ban', 'warn'];

//DEBUG
const { Console } = require('node:console');
const ogConsole = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});


type PlayerDbConfigType = {
    onJoinCheckBan: boolean;
    onJoinCheckWhitelist: boolean;
    whitelistRejectionMessage: string;
}
/**
 * Provide a central database for players, as well as assist with access control.
 */
export default class PlayerDatabase {
    readonly #db: Database;
    readonly #txAdmin: typeof TxAdmin;

    constructor(txAdmin: typeof TxAdmin, public config: PlayerDbConfigType) {
        this.#txAdmin = txAdmin;
        this.#db = new Database();
    }

    get isReady() {
        return this.#db.isReady;
    }

    /**
     * Returns the entire lowdb object. Please be careful with it :)
     */
    getDb() {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        // throw new Error(`dev note: not validated yet`);
        return this.#db.obj;
    }


    /**
     * Searches for a player in the database by the license, returns null if not found or false in case of error
     */
    getPlayerData(license: string): DatabasePlayerType | null {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (!/[0-9A-Fa-f]{40}/.test(license)) {
            throw new Error('Invalid reference type');
        }

        //Performing search
        const p = this.#db.obj.chain.get('players')
            .find({ license })
            .cloneDeep()
            .value();
        return (typeof p === 'undefined') ? null : p;
    }


    /**
     * Register a player to the database
     */
    registerPlayer(player: DatabasePlayerType): void {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        this.#db.obj.chain.get('players')
            .push(player)
            .value();
    }


    /**
     * Updates a player setting assigning srcData props to the database player.
     * The source data object is deep cloned to prevent weird side effects.
     */
    updatePlayer(license: string, srcData: Exclude<object, null>): DatabasePlayerType {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        const playerDbObj = this.#db.obj.chain.get('players').find({ license });
        if (!playerDbObj.value()) throw new Error('Player not found in database');
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        return playerDbObj
            .assign(cloneDeep(srcData))
            .cloneDeep()
            .value();
    }


    /**
     * Searches for any registered action in the database by a list of identifiers and optional filters
     * Usage example: getRegisteredActions(['license:xxx'], {type: 'ban', revocation.timestamp: null})
     */
    getRegisteredActions(
        idArray: string[],
        filter: Exclude<object, null> | Function = {}
    ): DatabaseActionType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (!Array.isArray(idArray)) throw new Error('Identifiers should be an array');
        try {
            return this.#db.obj.chain.get('actions')
                .filter(filter as any)
                .filter((a) => idArray.some((fi) => a.identifiers.includes(fi)))
                .cloneDeep()
                .value();
        } catch (error) {
            const msg = `Failed to search for a registered action database with error: ${(error as Error).message}`;
            if (verbose) logError(msg);
            throw new Error(msg);
        }
    }


    /**
     * Registers an action (ban, warn) and returns action id
     */
    registerAction(
        identifiers: string[],
        type: 'ban' | 'warn',
        author: string,
        reason: string,
        expiration: number | false = false,
        playerName: string | false = false
    ): string {
        //Sanity check
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (!Array.isArray(identifiers) || !identifiers.length) throw new Error('Invalid identifiers array.');
        if (!validActions.includes(type)) throw new Error('Invalid action type.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (typeof reason !== 'string' || !reason.length) throw new Error('Invalid reason.');
        if (expiration !== false && (typeof expiration !== 'number')) throw new Error('Invalid expiration.');
        if (playerName !== false && (typeof playerName !== 'string' || !playerName.length)) throw new Error('Invalid playerName.');

        //Saves it to the database
        const timestamp = now();
        try {
            const actionID = genActionID(this.#db.obj, type);
            const toDB: DatabaseActionType = {
                id: actionID,
                type,
                identifiers,
                playerName,
                reason,
                author,
                timestamp,
                expiration,
                revocation: {
                    timestamp: null,
                    author: null,
                },
            };
            this.#db.obj.chain.get('actions')
                .push(toDB)
                .value();
            this.#db.writeFlag(SAVE_PRIORITY_HIGH);
            return actionID;
        } catch (error) {
            let msg = `Failed to register event to database with message: ${(error as Error).message}`;
            logError(msg);
            if (verbose) dir(error);
            throw error;
        }
    }


    /**
     * Revoke an action (ban, warn)
     */
    revokeAction(
        actionId: string,
        author: string,
        allowedTypes: string[] | true = true
    ): DatabaseActionType {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (typeof actionId !== 'string' || !actionId.length) throw new Error('Invalid actionId.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (allowedTypes !== true && !Array.isArray(allowedTypes)) throw new Error('Invalid allowedTypes.');

        try {
            const action = this.#db.obj.chain.get('actions')
                .find({ id: actionId })
                .value();

            if (!action) throw new Error(`action not found`);
            if (allowedTypes !== true && !allowedTypes.includes(action.type)) {
                throw new Error(`you do not have permission to revoke this action`);
            }

            action.revocation = {
                timestamp: now(),
                author,
            };
            this.#db.writeFlag(SAVE_PRIORITY_HIGH);
            return cloneDeep(action);

        } catch (error) {
            const msg = `Failed to revoke action with message: ${(error as Error).message}`;
            logError(msg);
            if (verbose) dir(error);
            throw error;
        }
    }


    /**
     * Returns all whitelist approvals, which can be optionally filtered
     */
    getWhitelistApprovals(
        filter?: Exclude<object, null> | Function
    ): DatabaseWhitelistApprovalsType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        return this.#db.obj.chain.get('whitelistApprovals')
            .filter(filter as any)
            .cloneDeep()
            .value();
    }


    /**
     * Removes whitelist approvals based on a filter.
     */
    removeWhitelistApprovals(
        filter: Exclude<object, null> | Function
    ): DatabaseWhitelistApprovalsType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        this.#db.writeFlag(SAVE_PRIORITY_MEDIUM);
        return this.#db.obj.chain.get('whitelistApprovals')
            .remove(filter as any)
            .value();
    }


    /**
     * Returns all whitelist approvals, which can be optionally filtered
     */
    getWhitelistRequests(
        filter?: Exclude<object, null> | Function
    ): DatabaseWhitelistRequestsType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        return this.#db.obj.chain.get('whitelistRequests')
            .filter(filter as any)
            .cloneDeep()
            .value();
    }

    
    /**
     * Removes whitelist requests based on a filter.
     */
     removeWhitelistRequests(
        filter: Exclude<object, null> | Function
    ): DatabaseWhitelistRequestsType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        this.#db.writeFlag(SAVE_PRIORITY_MEDIUM);
        return this.#db.obj.chain.get('whitelistRequests')
            .remove(filter as any)
            .value();
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
        if (!this.#db.obj) throw new Error(`database not ready yet`);
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
                    const pending = await this.#db.obj.chain.get('pendingWL').find({ license: license }).value();
                    let whitelistID;
                    if (pending) {
                        pending.name = playerName;
                        pending.tsLastAttempt = now();
                        whitelistID = pending.id;
                    } else {
                        whitelistID = await genWhitelistID(this.#db.obj);
                        const toDB = {
                            id: whitelistID,
                            name: playerName,
                            license: license,
                            tsLastAttempt: now(),
                        };
                        await this.#db.obj.chain.get('pendingWL').push(toDB).value();
                    }
                    this.#db.writeFlag(SAVE_PRIORITY_LOW);

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
        if (!this.#db.obj) throw new Error(`database not ready yet`);
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
            const pending = await this.#db.obj.chain.get('pendingWL').find(pendingFilter).value();
            if (pending) playerName = pending.name;
        } else if (consts.regexWhitelistReqID.test(reference)) {
            pendingFilter = { id: reference };
            const pending = await this.#db.obj.chain.get('pendingWL').find(pendingFilter).value();
            if (!pending) throw new Error('Pending ID not found in database');
            saveReference = [`license:${pending.license}`];
            playerName = pending.name;
        } else {
            throw new Error('Invalid reference type');
        }

        //Register whitelist
        const actionID = await this.registerAction(saveReference, 'whitelist', author, null, false, playerName);
        if (!actionID) throw new Error('Failed to whitelist player');
        this.#db.writeFlag(SAVE_PRIORITY_HIGH);

        //Remove from the pending list
        if (playerName) {
            await this.#db.obj.chain.get('pendingWL').remove(pendingFilter).value();
        }

        return actionID;
    }


    /**
     * Cleans the database by removing every entry that matches the provided filter function.
     *
     * @param {String} table identifiers array
     * @param {function} filter lodash-compatible filter function
     * @returns {number|error} number of removed items
     */
    async cleanDatabase(tableName, filterFunc) {
        throw new Error(`not ready`);
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (tableName !== 'players' && tableName !== 'actions') throw new Error('Unknown tableName.');
        if (typeof filterFunc !== 'function') throw new Error('filterFunc must be a function.');

        try {
            const removed = await this.#db.obj.chain.get(tableName)
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
