const modulename = 'Player';
import logger, { ogConsole } from '@core/extras/console.js';
import PlayerDatabase from '@core/components/PlayerDatabase/index.js';
import cleanPlayerName from '@shared/cleanPlayerName';
import { verbose } from '@core/globalData.js';
import { DatabasePlayerType, DatabaseWhitelistApprovalsType } from '@core/components/PlayerDatabase/databaseTypes';
import { cloneDeep } from 'lodash-es';
import { parsePlayerIds, now } from '@core/extras/helpers';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Base class for ServerPlayer and DatabasePlayer.
 * NOTE: player classes are responsible to every and only business logic regarding the player object in the database.
 * In the future, when actions become part of the player object, algo ass them to these classes.
 */
export class BasePlayer {
    displayName: string = 'unknown';
    pureName: string = 'unknown';
    ids: string[] = [];
    hwids: string[] = [];
    license: null | string = null; //extracted for convenience
    dbData: false | DatabasePlayerType = false;
    isConnected: boolean = false;

    constructor(protected readonly dbInstance: PlayerDatabase, readonly uniqueId: Symbol) { }

    /**
     * Mutates the database data based on a source object to be applied
     * FIXME: if this is called for a disconnected ServerPlayer, it will not clean after 120s
     */
    protected mutateDbData(srcData: Exclude<object, null>) {
        if (!this.license) throw new Error(`cannot mutate database for a player that has no license`);
        this.dbData = this.dbInstance.updatePlayer(this.license, srcData, this.uniqueId);
    }

    /**
     * Returns all available identifiers (current+db)
     */
    getAllIdentifiers() {
        if (!this.ids.length) return [];
        let allIds = [...this.ids];
        if (this.dbData && this.dbData.ids) {
            allIds = allIds.concat(this.dbData.ids.filter(id => !allIds.includes(id)));
        }
        return allIds;
    }

    /**
     * Returns all actions related to all available ids
     * NOTE: theoretically ServerPlayer.setupDatabaseData() guarantees that DatabasePlayer.dbData.ids array
     *  will contain the license but may be better to also explicitly add it to the array here?
     */
    getHistory() {
        if (!this.ids.length) return [];
        return this.dbInstance.getRegisteredActions(this.getAllIdentifiers());
    }

    /**
     * Saves notes for this player.
     * NOTE: Techinically, we should be checking this.isRegistered, but not available in BasePlayer
     */
    setNote(text: string, author: string) {
        if (!this.license) throw new Error(`cannot save notes for a player that has no license`);
        this.mutateDbData({
            notes: {
                text,
                lastAdmin: author,
                tsLastEdit: now(),
            }
        });
    }

    /**
     * Saves the whitelist status for this player
     * NOTE: Techinically, we should be checking this.isRegistered, but not available in BasePlayer
     */
    setWhitelist(enabled: boolean) {
        if (!this.license) throw new Error(`cannot set whitelist status for a player that has no license`);
        this.mutateDbData({
            tsWhitelisted: enabled ? now() : undefined,
        });

        //Remove entries from whitelistApprovals & whitelistRequests
        const allIdsFilter = (x: DatabaseWhitelistApprovalsType) => {
            return this.ids.includes(x.identifier);
        }
        this.dbInstance.removeWhitelistApprovals(allIdsFilter);
        this.dbInstance.removeWhitelistRequests({ license: this.license });
    }
}


type PlayerDataType = {
    name: string,
    ids: string[],
    hwids: string[],
}

/**
 * Class to represent a player that is or was connected to the currently running server process.
 */
export class ServerPlayer extends BasePlayer {
    readonly netid: number;
    readonly tsConnected = now();
    readonly isRegistered: boolean;
    readonly #minuteCronInterval?: ReturnType<typeof setInterval>;
    // #offlineDbDataCacheTimeout?: ReturnType<typeof setTimeout>;

    constructor(netid: number, playerData: PlayerDataType, dbInstance: PlayerDatabase) {
        super(dbInstance, Symbol(`netid${netid}`));
        this.netid = netid;
        this.isConnected = true;
        if (
            playerData === null
            || typeof playerData !== 'object'
            || typeof playerData.name !== 'string'
            || !Array.isArray(playerData.ids)
            || !Array.isArray(playerData.hwids)
        ) {
            throw new Error(`invalid player data`);
        }

        //Processing identifiers
        //NOTE: ignoring IP completely
        const { validIdsArray, validIdsObject } = parsePlayerIds(playerData.ids);
        this.license = validIdsObject.license;
        this.ids = validIdsArray;

        //TODO: re-enable it when migrating to new database
        // this.hwids = playerData.hwids.filter(x => {
        //     return typeof x === 'string' && consts.regexValidHwidToken.test(x);
        // });

        //Processing player name
        const { displayName, pureName } = cleanPlayerName(playerData.name);
        this.displayName = displayName;
        this.pureName = pureName;

        //If this player is eligible to be on the database
        if (this.license) {
            this.#setupDatabaseData();
            this.isRegistered = !!this.dbData;
            this.#minuteCronInterval = setInterval(this.#minuteCron.bind(this), 60_000);
        } else {
            this.isRegistered = false;
        }
    }


    /**
     * Registers or retrieves the player data from the database.
     * NOTE: if player has license, we are guaranteeing license will be added to the database ids array
     */
    #setupDatabaseData() {
        if (!this.license || !this.isConnected) return;

        //Make sure the database is ready - this should be impossible
        if (!this.dbInstance.isReady) {
            logError(`Players database not yet ready, cannot read db status for player id ${this.displayName}.`);
            return;
        }

        //Check if player is already on the database
        try {
            const dbPlayer = this.dbInstance.getPlayerData(this.license);
            if (dbPlayer) {
                //Updates database data
                this.dbData = dbPlayer;
                this.mutateDbData({
                    displayName: this.displayName,
                    pureName: this.pureName,
                    tsLastConnection: this.tsConnected,
                    ids: [
                        ...dbPlayer.ids,
                        ...this.ids.filter(id => !dbPlayer.ids.includes(id))
                    ]
                });
            } else {
                //Register player to the database
                const toRegister = {
                    license: this.license,
                    ids: this.ids,
                    displayName: this.displayName,
                    pureName: this.pureName,
                    playTime: 0,
                    tsLastConnection: this.tsConnected,
                    tsJoined: this.tsConnected,
                };
                this.dbInstance.registerPlayer(toRegister);
                this.dbData = toRegister;
                if (verbose) logOk(`Adding '${this.displayName}' to players database.`);
            }
        } catch (error) {
            logError(`Failed to load/register player ${this.displayName} from/to the database with error: ${(error as Error).message}`);
        }
    }

    /**
     * Sets the dbData.
     * Used when some other player instance mutates the database and we need to sync all players 
     * with the same license.
     */
    syncUpstreamDbData(srcData: DatabasePlayerType) {
        this.dbData = cloneDeep(srcData)
    }

    /**
     * Returns a clone of this.dbData.
     * If the data is not available, it means the player was disconnected and dbData wiped to save memory,
     * so start an 120s interval to wipe it from memory again. This period can be considered a "cache"
     * FIXME: review dbData optimization, 50k players would be up to 50mb
     */
    getDbData() {
        if (this.dbData) {
            return cloneDeep(this.dbData);
        } else if (this.license && this.isRegistered) {
            const dbPlayer = this.dbInstance.getPlayerData(this.license);
            if (!dbPlayer) return false;

            this.dbData = dbPlayer;
            // clearTimeout(this.#offlineDbDataCacheTimeout); //maybe not needed?
            // this.#offlineDbDataCacheTimeout = setTimeout(() => {
            //     this.dbData = false;
            // }, 120_000);
            return cloneDeep(this.dbData);
        } else {
            return false;
        }
    }


    /**
     *  Updates dbData play time every minute
     */
    #minuteCron() {
        if (!this.dbData || !this.isConnected) return;
        try {
            this.mutateDbData({ playTime: this.dbData.playTime + 1 });
        } catch (error) {
            logWarn(`Failed to update playtime for player ${this.displayName}: ${(error as Error).message}`);
        }
    }


    /**
     * Marks this player as disconnected, clears dbData (mem optimization) and clears minute cron
     */
    disconnect() {
        this.isConnected = false;
        // this.dbData = false;
        clearInterval(this.#minuteCronInterval);
    }
}


/**
 * Class to represent players stored in the database.
 */
export class DatabasePlayer extends BasePlayer {
    readonly isRegistered = true; //no need to check because otherwise constructor throws

    constructor(license: string, dbInstance: PlayerDatabase) {
        super(dbInstance, Symbol(`db${license}`));
        if (typeof license !== 'string') {
            throw new Error(`invalid player license`);
        }

        //find db player
        const dbPlayer = this.dbInstance.getPlayerData(license);
        if (!dbPlayer) {
            throw new Error(`player not found in database`);
        }

        //fill in data
        this.dbData = dbPlayer;
        this.license = license;
        this.ids = dbPlayer.ids;
        this.displayName = dbPlayer.displayName;
        this.pureName = dbPlayer.pureName;
    }

    /**
     * Returns a clone of this.dbData
     */
    getDbData() {
        return cloneDeep(this.dbData);
    }
}


export type PlayerClass = ServerPlayer | DatabasePlayer;
