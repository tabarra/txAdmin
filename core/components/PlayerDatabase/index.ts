const modulename = 'PlayerDatabase';
import logger, { ogConsole } from '@core/extras/console.js';
import { verbose } from '@core/globalData';
// eslint-disable-next-line no-unused-vars
import { SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH, Database } from './database';
import { genActionID, genWhitelistRequestID } from './idGenerator';
import TxAdmin from '@core/txAdmin.js';
import { DatabaseActionType, DatabaseDataType, DatabasePlayerType, DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from './databaseTypes';
import { cloneDeep } from 'lodash-es';
import { now } from '@core/extras/helpers';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


//Consts
const validActions = ['ban', 'warn'];
export class DuplicateKeyError extends Error {
    readonly code = 'DUPLICATE_KEY';
    constructor(message: string) {
        super(message);
    }
}
type PlayerDbConfigType = {
    onJoinCheckBan: boolean;
    onJoinCheckWhitelist: boolean;
    banRejectionMessage: string;
    whitelistRejectionMessage: string;
}


/**
 * Provide a central database for players, as well as assist with access control.
 * TODO: maybe after finishing the parts, move them to xxx.controller.ts dividing it by the tables?
 */
export default class PlayerDatabase {
    readonly #db: Database;
    readonly #txAdmin: TxAdmin;

    constructor(txAdmin: TxAdmin, public config: PlayerDbConfigType) {
        this.#txAdmin = txAdmin;
        this.#db = new Database();

        //Database optimization cron function
        setTimeout(() => {
            this.runDailyOptimizer();
        }, 30_000);
        setInterval(() => {
            this.runDailyOptimizer();
        }, 24 * 60 * 60_000);
    }


    /**
     * Returns if the lowdb instance is ready
     */
    get isReady() {
        return this.#db.isReady;
    }

    /**
     * Refresh configurations
     */
    refreshConfig() {
        this.config = this.#txAdmin.configVault.getScoped('playerDatabase');
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
        //TODO: validate player data vs DatabasePlayerType props

        //Check for duplicated license
        const found = this.#db.obj.chain.get('players')
            .filter({ license: player.license })
            .value();
        if (found.length) throw new DuplicateKeyError(`this license is already registered`);

        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        this.#db.obj.chain.get('players')
            .push(player)
            .value();
    }


    /**
     * Updates a player setting assigning srcData props to the database player.
     * The source data object is deep cloned to prevent weird side effects.
     */
    updatePlayer(license: string, srcData: Exclude<object, null>, srcUniqueId: Symbol): DatabasePlayerType {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (typeof (srcData as any).license !== 'undefined') {
            throw new Error(`cannot license field`);
        }

        const playerDbObj = this.#db.obj.chain.get('players').find({ license });
        if (!playerDbObj.value()) throw new Error('Player not found in database');
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        const newData = playerDbObj
            .assign(cloneDeep(srcData))
            .cloneDeep()
            .value();
        this.#txAdmin.playerlistManager.handleDbDataSync(newData, srcUniqueId);
        return newData;
    }


    /**
     * Revokes whitelist status of all players that match a filter function
     * @returns the number of revoked whitelists
     */
    bulkRevokePlayerWhitelist(filterFunc: Function): number {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (typeof filterFunc !== 'function') throw new Error('filterFunc must be a function.');

        let cntChanged = 0;
        const srcSymbol = Symbol('bulkRevokePlayerWhitelist');
        this.#db.obj.data!.players.forEach((player) => {
            if (player.tsWhitelisted && filterFunc(player)) {
                cntChanged++;
                player.tsWhitelisted = undefined;
                this.#txAdmin.playerlistManager.handleDbDataSync(cloneDeep(player), srcSymbol);
            }
        });

        this.#db.writeFlag(SAVE_PRIORITY_HIGH);
        return cntChanged;
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
     * Register a whitelist request to the database
     */
    registerWhitelistApprovals(approval: DatabaseWhitelistApprovalsType): void {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        //TODO: validate player data vs DatabaseWhitelistApprovalsType props

        //Check for duplicated license
        const found = this.#db.obj.chain.get('whitelistApprovals')
            .filter({ identifier: approval.identifier })
            .value();
        if (found.length) throw new DuplicateKeyError(`this identifier is already whitelisted`);

        //Register new
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        this.#db.obj.chain.get('whitelistApprovals')
            .push(cloneDeep(approval))
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
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        return this.#db.obj.chain.get('whitelistRequests')
            .remove(filter as any)
            .value();
    }


    /**
     * Updates a whitelist request setting assigning srcData props to the database object.
     * The source data object is deep cloned to prevent weird side effects.
     */
    updateWhitelistRequests(license: string, srcData: Exclude<object, null>): DatabaseWhitelistRequestsType {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (typeof (srcData as any).id !== 'undefined' || typeof (srcData as any).license !== 'undefined') {
            throw new Error(`cannot update id or license fields`);
        }

        const requestDbObj = this.#db.obj.chain.get('whitelistRequests').find({ license });
        if (!requestDbObj.value()) throw new Error('Request not found in database');
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        return requestDbObj
            .assign(cloneDeep(srcData))
            .cloneDeep()
            .value();
    }


    /**
     * Register a whitelist request to the database
     */
    registerWhitelistRequests(request: Omit<DatabaseWhitelistRequestsType, "id">): string {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        //TODO: validate player data vs DatabaseWhitelistRequestsType props
        if (typeof (request as any).id !== 'undefined') {
            throw new Error(`cannot manually set the id field`);
        }

        const id = genWhitelistRequestID(this.#db.obj);
        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        this.#db.obj.chain.get('whitelistRequests')
            .push({ id, ...cloneDeep(request) })
            .value();
        return id;
    }


    /**
     * Cleans the database by removing every entry that matches the provided filter function.
     * @returns {number} number of removed items
     */
    cleanDatabase(
        tableName: 'players' | 'actions' | 'whitelistApprovals' | 'whitelistRequests',
        filterFunc: Function
    ): number {
        if (!this.#db.obj || !this.#db.obj.data) throw new Error(`database not ready yet`);
        if (!Array.isArray(this.#db.obj.data[tableName])) throw new Error('Table selected isn\'t an array.');
        if (typeof filterFunc !== 'function') throw new Error('filterFunc must be a function.');

        try {
            this.#db.writeFlag(SAVE_PRIORITY_HIGH);
            const removed = this.#db.obj.chain.get(tableName)
                .remove(filterFunc as any)
                .value();
            return removed.length;
        } catch (error) {
            const msg = `Failed to clean database with error: ${(error as Error).message}`;
            if (verbose) logError(msg);
            throw new Error(msg);
        }
    }


    /**
     * Cron func to optimize the database removing players and whitelist reqs/approvals
     */
    runDailyOptimizer() {
        if (!this.#db.obj || !this.#db.obj.data) throw new Error(`database not ready yet`);
        const oneDay = 24 * 60 * 60;

        //Optimize players
        //Players that have not joined the last 16 days, and have less than 2 hours of playtime
        let playerRemoved;
        try {
            const nineDaysAgo = now() - (16 * oneDay);
            const filter = (p: DatabasePlayerType) => {
                return (p.tsLastConnection < nineDaysAgo && p.playTime < 120);
            }
            playerRemoved = this.cleanDatabase('players', filter);
        } catch (error) {
            const msg = `Failed to optimize players database with error: ${(error as Error).message}`;
            logError(msg);
        }

        //Optimize whitelistRequests + whitelistApprovals
        //Removing the ones older than 7 days
        let wlRequestsRemoved, wlApprovalsRemoved;
        const sevenDaysAgo = now() - (7 * oneDay);
        try {
            const wlRequestsFilter = (req: DatabaseWhitelistRequestsType) => {
                return (req.tsLastAttempt < sevenDaysAgo);
            }
            wlRequestsRemoved = this.removeWhitelistRequests(wlRequestsFilter).length;

            const wlApprovalsFilter = (req: DatabaseWhitelistApprovalsType) => {
                return (req.tsApproved < sevenDaysAgo);
            }
            wlApprovalsRemoved = this.removeWhitelistApprovals(wlApprovalsFilter).length;
        } catch (error) {
            const msg = `Failed to optimize players database with error: ${(error as Error).message}`;
            logError(msg);
        }

        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        logOk(`Database optimized, removed:`);
        logOk(`- ${playerRemoved} players that haven't connected in the past 9 days and had less than 2 hours of playtime.`);
        logOk(`- ${wlRequestsRemoved} whitelist requests older than a week.`);
        logOk(`- ${wlApprovalsRemoved} whitelist approvals older than a week.`);
    }
};
