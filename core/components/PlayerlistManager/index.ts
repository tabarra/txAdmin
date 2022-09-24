const modulename = 'PlayerlistManager';
import { cloneDeep } from 'lodash-es';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData';
import TxAdmin from '@core/txAdmin.js';
import ServerPlayer from '@core/playerLogic/playerClasses.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


//Helpers
const now = () => { return Math.round(Date.now() / 1000); };


type PlayerDatabaseConfigType = {
    onJoinCheckBan: boolean;
    onJoinCheckWhitelist: boolean;
    whitelistRejectionMessage: string;
    wipePendingWLOnStart: boolean;
}
export default class PlayerlistManager {
    readonly #txAdmin: TxAdmin;
    playerlist: (ServerPlayer | undefined)[] = [];

    constructor(
        txAdmin: TxAdmin,
        public config: PlayerDatabaseConfigType
    ) {
        this.#txAdmin = txAdmin;
    }


    /**
     * Handler for server restart.
     * We MUST do .disconnect() for all players to clear the timers.
     */
    handleServerStop() {
        for (const player of this.playerlist) {
            if(player) player.disconnect();
        }
        this.playerlist = [];
    }


    /**
     * Returns a playerlist array with ServerPlayer data.
     * The data is cloned to prevent pollution.
     */
    getPlayerList() {
        return this.playerlist
            .filter(p => p?.isConnected)
            .map((p) => {
                return cloneDeep({
                    netid: p!.netid,
                    displayName: p!.displayName,
                    pureName: p!.pureName,
                    ids: p!.ids,
                    license: p!.license,
                });
            });
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
                this.playerlist[payload.id] = new ServerPlayer(payload.id, payload.player, this.#txAdmin.playerDatabase);
                // this.#txAdmin.logger.server.handlePlayerJoin(); FIXME:
            } catch (error) {
                if (verbose) logWarn(`playerJoining event error: ${(error as Error).message}`);
            }

        } else if (payload.event === 'playerDropped') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (!(this.playerlist[payload.id] instanceof ServerPlayer)) throw new Error(`player id not found`);
                this.playerlist[payload.id]!.disconnect();
                // this.#txAdmin.logger.server.handlePlayerJoin(); FIXME:
            } catch (error) {
                if (verbose) logWarn(`playerDropped event error: ${(error as Error).message}`);
            }
        } else {
            logWarn(`Invalid event: ${payload?.event}`);
        }
    }
};
