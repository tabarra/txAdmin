const modulename = 'PlayerDatabase';
// eslint-disable-next-line no-unused-vars
import { SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH, Database } from './database';
import { genActionID, genWhitelistRequestID } from './idGenerator';
import TxAdmin from '@core/txAdmin.js';
import { DatabaseActionType, DatabaseDataType, DatabasePlayerType, DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from './databaseTypes';
import { cloneDeep } from 'lodash-es';
import { now } from '@core/extras/helpers';
import consoleFactory from '@extras/console';
import { MultipleCounter } from '../StatisticsManager/statsUtils';
const console = consoleFactory(modulename);


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
    whitelistMode: 'disabled' | 'adminOnly' | 'guildMember' | 'guildRoles' | 'approvedLicense';
    whitelistedDiscordRoles: string[];
    whitelistRejectionMessage: string;
    requiredBanHwidMatches: number;
    banRejectionMessage: string;
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

        //Checking config validity
        if (this.config.requiredBanHwidMatches < 0 || this.config.requiredBanHwidMatches > 6) {
            throw new Error('The playerDatabase.requiredBanHwidMatches setting must be between 0 (disabled) and 6.');
        }

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
    getPlayersByFilter(filter: object | Function): DatabasePlayerType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);

        //Check for duplicated license
        return this.#db.obj.chain.get('players')
            .filter(filter as any)
            .cloneDeep()
            .value();
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
    updatePlayer(license: string, srcData: object, srcUniqueId: Symbol): DatabasePlayerType {
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
     * Searches for an action in the database by the id, returns action or null if not found
     */
    getActionData(actionId: string): DatabaseActionType | null {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (typeof actionId !== 'string' || !actionId.length) throw new Error('Invalid actionId.');

        //Performing search
        const a = this.#db.obj.chain.get('actions')
            .find({ id: actionId })
            .cloneDeep()
            .value();
        return (typeof a === 'undefined') ? null : a;
    }


    /**
     * Searches for any registered action in the database by a list of identifiers and optional filters
     * Usage example: getRegisteredActions(['license:xxx'], undefined, {type: 'ban', revocation.timestamp: null})
     */
    getRegisteredActions(
        idsArray: string[],
        hwidsArray?: string[],
        customFilter: object | Function = {}
    ): DatabaseActionType[] {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (!Array.isArray(idsArray)) throw new Error('idsArray should be an array');
        if (hwidsArray && !Array.isArray(hwidsArray)) throw new Error('hwidsArray should be an array or undefined');
        const idsFilter = (action: DatabaseActionType) => idsArray.some((fi) => action.ids.includes(fi))
        const hwidsFilter = (action: DatabaseActionType) => {
            if (!action.hwids) return false;
            const count = hwidsArray!.filter((fi) => action.hwids!.includes(fi)).length
            return count >= this.config.requiredBanHwidMatches;
        }

        try {
            //small optimization
            const idsMatchFilter = hwidsArray && hwidsArray.length && this.config.requiredBanHwidMatches
                ? (a: DatabaseActionType) => idsFilter(a) || hwidsFilter(a)
                : (a: DatabaseActionType) => idsFilter(a)

            return this.#db.obj.chain.get('actions')
                .filter(customFilter as any)
                .filter(idsMatchFilter)
                .cloneDeep()
                .value();
        } catch (error) {
            const msg = `Failed to search for a registered action database with error: ${(error as Error).message}`;
            console.verbose.error(msg);
            throw new Error(msg);
        }
    }


    /**
     * Registers an action (ban, warn) and returns action id
     */
    registerAction(
        ids: string[],
        type: 'ban' | 'warn',
        author: string,
        reason: string,
        expiration: number | false = false,
        playerName: string | false = false,
        hwids?: string[], //only used for bans
    ): string {
        //Sanity check
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        if (!Array.isArray(ids) || !ids.length) throw new Error('Invalid ids array.');
        if (!validActions.includes(type)) throw new Error('Invalid action type.');
        if (typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if (typeof reason !== 'string' || !reason.length) throw new Error('Invalid reason.');
        if (expiration !== false && (typeof expiration !== 'number')) throw new Error('Invalid expiration.');
        if (playerName !== false && (typeof playerName !== 'string' || !playerName.length)) throw new Error('Invalid playerName.');
        if (hwids && !Array.isArray(hwids)) throw new Error('Invalid hwids array.');
        if (type !== 'ban' && hwids) throw new Error('Hwids should only be used for bans.')

        //Saves it to the database
        const timestamp = now();
        try {
            const actionID = genActionID(this.#db.obj, type);
            const toDB: DatabaseActionType = {
                id: actionID,
                type,
                ids,
                hwids,
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
            console.error(msg);
            console.verbose.dir(error);
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
            console.error(msg);
            console.verbose.dir(error);
            throw error;
        }
    }


    /**
     * Returns all whitelist approvals, which can be optionally filtered
     */
    getWhitelistApprovals(
        filter?: object | Function
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
        filter: object | Function
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
        filter?: object | Function
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
        filter: object | Function
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
    updateWhitelistRequests(license: string, srcData: object): DatabaseWhitelistRequestsType {
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
     * Returns players stats for the database (for Players page callouts)
     */
    getPlayersStats() {
        if (!this.#db.obj || !this.#db.obj.data) throw new Error(`database not ready yet`);

        const oneDayAgo = now() - (24 * 60 * 60);
        const sevenDaysAgo = now() - (7 * 24 * 60 * 60);
        const startingValue = {
            total: 0,
            playedLast24h: 0,
            joinedLast24h: 0,
            joinedLast7d: 0,
        };
        const playerStats = this.#db.obj.chain.get('players')
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
        if (!this.#db.obj || !this.#db.obj.data) throw new Error(`database not ready yet`);

        const sevenDaysAgo = now() - (7 * 24 * 60 * 60);
        const startingValue = {
            totalWarns: 0,
            warnsLast7d: 0,
            totalBans: 0,
            bansLast7d: 0,
            groupedByAdmins: new MultipleCounter(),
        };
        const actionStats = this.#db.obj.chain.get('actions')
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
        if (!this.#db.obj || !this.#db.obj.data) throw new Error(`database not ready yet`);

        const actionStats = this.#db.obj.chain.get('actions')
            .reduce((acc, a, ind) => {
                if (a.type == 'ban') {
                    acc.bans++;
                } else if (a.type == 'warn') {
                    acc.warns++;
                }
                return acc;
            }, { bans: 0, warns: 0 })
            .value();

        const playerStats = this.#db.obj.chain.get('players')
            .reduce((acc, p, ind) => {
                acc.players++;
                acc.playTime += p.playTime;
                if (p.tsWhitelisted) acc.whitelists++;
                return acc;
            }, { players: 0, playTime: 0, whitelists: 0 })
            .value();

        return { ...actionStats, ...playerStats }
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
            console.verbose.error(msg);
            throw new Error(msg);
        }
    }


    /**
     * Cleans the hwids from the database.
     * @returns {number} number of removed HWIDs
     */
    wipeHwids(
        fromPlayers: boolean,
        fromBans: boolean,
    ): number {
        if (!this.#db.obj || !this.#db.obj.data) throw new Error(`database not ready yet`);
        if (!Array.isArray(this.#db.obj.data.players)) throw new Error('Players table isn\'t an array yet.');
        if (!Array.isArray(this.#db.obj.data.players)) throw new Error('Actions table isn\'t an array yet.');
        if (typeof fromPlayers !== 'boolean' || typeof fromBans !== 'boolean') throw new Error('The parameters should be booleans.');

        try {
            this.#db.writeFlag(SAVE_PRIORITY_HIGH);
            let removed = 0;
            if (fromPlayers) {
                this.#db.obj.chain.get('players')
                    .map(player => {
                        removed += player.hwids.length;
                        player.hwids = [];
                        return player;
                    })
                    .value();
            }
            if (fromBans)
                this.#db.obj.chain.get('actions')
                    .map(action => {
                        if (action.type !== 'ban' || !action.hwids) {
                            return action;
                        } else {
                            removed += action.hwids.length;
                            action.hwids = [];
                            return action;
                        }
                    })
                    .value();
            return removed;
        } catch (error) {
            const msg = `Failed to clean database with error: ${(error as Error).message}`;
            console.verbose.error(msg);
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
            const sixteenDaysAgo = now() - (16 * oneDay);
            const filter = (p: DatabasePlayerType) => {
                return (p.tsLastConnection < sixteenDaysAgo && p.playTime < 120);
            }
            playerRemoved = this.cleanDatabase('players', filter);
        } catch (error) {
            const msg = `Failed to optimize players database with error: ${(error as Error).message}`;
            console.error(msg);
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
            console.error(msg);
        }

        this.#db.writeFlag(SAVE_PRIORITY_LOW);
        console.ok(`Internal Database optimized. This applies only for the txAdmin internal database, and does not affect your MySQL or framework (ESX/QBCore/etc) databases.`);
        console.ok(`- ${playerRemoved} players that haven't connected in the past 16 days and had less than 2 hours of playtime.`);
        console.ok(`- ${wlRequestsRemoved} whitelist requests older than a week.`);
        console.ok(`- ${wlApprovalsRemoved} whitelist approvals older than a week.`);
    }
};
