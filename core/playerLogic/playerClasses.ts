const modulename = 'Player';
import logger from '@core/extras/console.js';
import consts from '@core/extras/consts';
import PlayerDatabase, { PlayerDbDataType } from '@core/components/PlayerDatabase/index.js';
import { cleanPlayerName } from '@core/extras/shared';
import { verbose } from '@core/globalData.js';
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
 * 
 */
export class BasePlayer {
    displayName: string; //FIXME: fica aqui ou no serverplayer?
    pureName: string; //FIXME: fica aqui ou no serverplayer?
    ids: string[] = [];
    hwids: string[] = [];
    license: false | string = false; //extracted for convenience
    dbData: false | PlayerDbDataType = false;
    isConnected: boolean = false;

    constructor(protected readonly dbInstance: PlayerDatabase) { }

    protected mutateDadabase(srcData: Exclude<object, null>) {
        if (!this.license) throw new Error(`cannot mutate database for a player that hasn o license`);
        this.dbData = this.dbInstance.updatePlayer(this.license, srcData);
    }

    setNote() {
        //if dbData?
    }

    getHistory() {
        //if any identifier
    }

    ban() {
        //
    }
}



type PlayerDataType = {
    name: string,
    ids: string[],
    hwids: string[],
}

/**
 * 
 */
export default class ServerPlayer extends BasePlayer {
    readonly netid: number;
    readonly tsConnected = now();
    readonly #minuteCronInterval?: ReturnType<typeof setInterval>;

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
            this.#minuteCronInterval = setInterval(this.#minuteCron.bind(this), 60_000);
        }
    }


    /**
     * 
     */
    #setupDatabaseData() {
        if (!this.license || !this.isConnected) return;

        //Make sure the database is ready - this should be impossible
        if (!this.dbInstance.db.isReady) {
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
                    name: this.displayName, //FIXME: displayName + pureName
                    tsLastConnection: this.tsConnected,
                    //FIXME: add identifiers
                });
            } else {
                //Register player to the database
                const toRegister = {
                    license: this.license,
                    name: this.displayName, //FIXME: displayName + pureName
                    playTime: 0,
                    tsLastConnection: this.tsConnected,
                    tsJoined: this.tsConnected,
                    notes: {
                        text: '',
                        lastAdmin: null,
                        tsLastEdit: null,
                    },
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
     * 
     */
    disconnect() {
        this.isConnected = false;
        this.dbData = false;
        clearInterval(this.#minuteCronInterval);
    }


    /**
     * 
     */
    warn() {
        //
    }
}
