const modulename = 'Player';
import logger from '@core/extras/console.js';
import consts from '@core/extras/consts';
import PlayerDatabase from '@core/components/PlayerDatabase/index.js';
import cleanPlayerName from '@shared/cleanPlayerName';
import { verbose } from '@core/globalData.js';
import { DatabasePlayerType } from '@core/components/PlayerDatabase/databaseTypes';
import { cloneDeep } from 'lodash-es';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };

//DEBUG
const { Console } = require('node:console');
const ogConsole = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});


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
    license: false | string = false; //extracted for convenience
    dbData: false | DatabasePlayerType = false;
    isConnected: boolean = false;

    constructor(protected readonly dbInstance: PlayerDatabase) { }

    /**
     * Mutates the database data based on a source object to be applied
     */
    protected mutateDadabase(srcData: Exclude<object, null>) {
        if (!this.license) throw new Error(`cannot mutate database for a player that has no license`);
        this.dbData = this.dbInstance.updatePlayer(this.license, srcData);
    }

    /**
     * Returns all actions related to all available ids
     * NOTE: theoretically ServerPlayer.setupDatabaseData() guarantees that DatabasePlayer.dbData.ids array
     *  will contain the license but may be better to also explicitly add it to the array here?
     */
    getHistory() {
        if (!this.ids.length) return [];
        let searchIds = [...this.ids];
        if (this.dbData && this.dbData.ids) {
            searchIds = searchIds.concat(this.dbData.ids.filter(id => !searchIds.includes(id)))
        }
        return this.dbInstance.getRegisteredActions(searchIds);
    }

    /**
     * Saves notes for this player.
     * NOTE: Techinically, we should be checking this.isRegistered, but not available in BasePlayer
     */
    setNote(text: string, author: string) {
        if (!this.license) throw new Error(`cannot save notes for a player that has no license`);
        this.mutateDadabase({
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
        this.mutateDadabase({
            tsWhitelisted: enabled ? now() : undefined,
        });
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
    #offlineDbDataCacheTimeout?: ReturnType<typeof setTimeout>;

    constructor(netid: number, playerData: PlayerDataType, dbInstance: PlayerDatabase) {
        super(dbInstance);
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
        for (const idString of playerData.ids) {
            const [idType, idValue] = idString.split(':', 2);
            const validator = consts.validIdentifiers[idType as keyof typeof consts.validIdentifiers];
            if (validator && validator.test(idString)) {
                this.ids.push(idString);
                if (idType === 'license') {
                    this.license = idValue;
                }
            }
        }
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
     * 
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
                this.mutateDadabase({
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
     * Returns a clone of this.dbData.
     * If the data is not available, it means the player was disconnected and dbData wiped to save memory,
     * so start an 120s interval to wipe it from memory again. This period can be considered a "cache"
     */
    getDbData() {
        if (this.dbData) {
            return cloneDeep(this.dbData);
        } else if (this.license && this.isRegistered) {
            const dbPlayer = this.dbInstance.getPlayerData(this.license);
            if (!dbPlayer) return false;

            this.dbData = dbPlayer;
            clearTimeout(this.#offlineDbDataCacheTimeout); //maybe not needed?
            this.#offlineDbDataCacheTimeout = setTimeout(() => {
                this.dbData = false;
            }, 120_000);
            return cloneDeep(this.dbData);
        } else {
            return false;
        }
    }


    /**
     *  
     */
    #minuteCron() {
        if (!this.dbData || !this.isConnected) return;
        try {
            this.mutateDadabase({ playTime: this.dbData.playTime + 1 });
            logOk(`Updating '${this.displayName}' databse playTime.`);
        } catch (error) {
            logWarn(`Failed to update playtime for player ${this.displayName}: ${(error as Error).message}`);
        }
    }


    /**
     * Marks this player as disconnected, clears dbData (mem optimization) and clears minute cron
     */
    disconnect() {
        this.isConnected = false;
        this.dbData = false;
        clearInterval(this.#minuteCronInterval);
    }
}


/**
 * Class to represent players stored in the database.
 */
export class DatabasePlayer extends BasePlayer {
    readonly isRegistered = true; //no need to check because otherwise constructor throws

    constructor(license: string, dbInstance: PlayerDatabase) {
        super(dbInstance);
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
