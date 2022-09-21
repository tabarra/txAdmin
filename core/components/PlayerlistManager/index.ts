const modulename = 'PlayerlistManager';
import { promisify } from 'util';
import ServerPlayer from './ServerPlayer.class';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData';
import TxAdmin from '@core/txAdmin.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//DEBUG
const { Console } = require('node:console');
const ogConsole = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});

//Helpers
const sleep = promisify((d: number, f: Function) => setTimeout(f, d));
const now = () => { return Math.round(Date.now() / 1000); };


type PlayerDatabaseConfigType = {
    onJoinCheckBan: boolean;
    onJoinCheckWhitelist: boolean;
    minSessionTime: number;
    whitelistRejectionMessage: string;
    wipePendingWLOnStart: boolean;
}
export default class PlayerlistManager {
    playerlist: (ServerPlayer | undefined)[] = [];

    constructor(
        protected readonly txAdmin: TxAdmin,
        public config: PlayerDatabaseConfigType
    ) {
        //Config check
        if (this.config.minSessionTime < 1 || this.config.minSessionTime > 60) throw new Error('The playerController.minSessionTime setting must be between 1 and 60 minutes.');

        //Cron functions
        setInterval(async () => {
            try {
                await this.processActive();
            } catch (error) {
                logWarn(`Failed to process/update active players: ${(error as Error).message}`);
            }
        }, 60_000);
    }


    /**
     * Handler for server restart
     */
    handleServerStop() {
        //TODO:
    }


    /**
     * Processes active players to save playtime
     */
    async processActive() {
        if (!this.txAdmin.playerDatabase.db.isReady) {
            logWarn('Players database not yet ready, skipping processActive().');
            return;
        }


        for (let netid = 0; netid < this.playerlist.length; netid++) {
            const player = this.playerlist[netid];
            if (!(player instanceof ServerPlayer) || !player.license) continue;
            if (!player.isConnected) continue;

            try {
                const sessionTime = now() - player.tsConnected;

                //If its time to add this player to the database
                //HACK this.config.minSessionTime
                if (!player.dbData && sessionTime >= 0) {
                    if (player.license == '3333333333333333333333deadbeef0000nosave') continue;

                    const toRegister = {
                        license: player.license,
                        name: player.displayName,
                        playTime: Math.ceil(sessionTime / 60),
                        tsLastConnection: player.tsConnected,
                        tsJoined: player.tsConnected,
                        notes: {
                            text: '',
                            lastAdmin: null,
                            tsLastEdit: null,
                        },
                    };
                    await this.txAdmin.playerDatabase.registerPlayer(toRegister);
                    await player.setDbData(toRegister);
                    if (verbose) logOk(`Adding '${player.displayName}' to players database.`);

                //If it's time to update this player's play time
                } else if (!player.dbData) {
                    // p.playTime += 1;
                    // const toUpdate = {
                    //     name: player.displayName,
                    //     playTime: player.playTime,
                    //     tsLastConnection: player.tsConnected,
                    // }
                    // await this.txAdmin.playerDatabase.updatePlayer(player.license, null);
                    // await player.setDbData(toRegister);
                    logOk(`Updating '${player.displayName}' in players database.`); //DEBUG
                }
            } catch (error) {
                logWarn(`Failed to process/update active players netid ${netid}: ${(error as Error).message}`);
            }
        }
    }


    /**
     * Handler for all txAdminPlayerlistEvent structured trace events
     * @param {*} payload
     */
    async handleServerEvents(payload: any) {
        if (payload.event === 'playerJoining') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (typeof this.playerlist[payload.id] !== 'undefined') throw new Error(`duplicated player id`);
                this.playerlist[payload.id] = new ServerPlayer(payload.id, payload.player);
                await this.handlePlayerJoin(payload.id);
            } catch (error) {
                if (verbose) logWarn(`playerJoining event error: ${(error as Error).message}`);
            }

        } else if (payload.event === 'playerDropped') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (typeof this.playerlist[payload.id] === 'undefined') throw new Error(`player id not found`);
                await this.handlePlayerDrop(payload.id);
            } catch (error) {
                if (verbose) logWarn(`playerDropped event error: ${(error as Error).message}`);
            }
        } else {
            logWarn(`Invalid event: ${payload?.event}`);
        }
    }


    /**
     * Processes new player and sets the dbData props
     */
    private async handlePlayerJoin(netid: number) {
        //Check if player has a license
        const player = this.playerlist[netid];
        if (!(player instanceof ServerPlayer) || !player.license) return;

        //Make sure the database is ready - or wait 15 seconds
        if (!this.txAdmin.playerDatabase.db.isReady) {
            await sleep(15_000);
            if (!this.txAdmin.playerDatabase.db.isReady) {
                logError(`Players database not yet ready, cannot read db status for player id ${netid}.`);
                return;
            }
        }

        //Check if he is already on the database
        try {
            const dbPlayer = await this.txAdmin.playerDatabase.getPlayer(player.license);
            if (dbPlayer) {
                player.setDbData(dbPlayer);
            }
        } catch (error) {
            if (verbose) logError(`Failed to search for a player in the database with error: ${(error as Error).message}`);
        }
    }


    /**
     * Handler for player drops
     */
    private async handlePlayerDrop(netid: number) {
        //Check if player exists and marks him as disconnected.
        const player = this.playerlist[netid];
        if (!(player instanceof ServerPlayer)) return;
        player.disconnect()

        //Save to the database
        if (!player.license || !player.dbData) return;
        //anything to save?
    }
};
