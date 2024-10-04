const modulename = 'PlayerlistManager';
import { cloneDeep } from 'lodash-es';
import TxAdmin from '@core/txAdmin.js';
import { ServerPlayer } from '@core/playerLogic/playerClasses.js';
import { DatabaseActionWarnType, DatabasePlayerType } from '../PlayerDatabase/databaseTypes';
import consoleFactory from '@extras/console';
import { PlayerDroppedEventType, PlayerJoiningEventType } from '@shared/socketioTypes';
const console = consoleFactory(modulename);


export type PlayerDropEvent = {
    type: 'txAdminPlayerlistEvent',
    event: 'playerDropped',
    id: number,
    reason: string, //need to check if this is always a string
    resource?: string,
    category?: number,
}

/**
 * The PlayerlistManager will store a ServerPlayer instance for all players that connected to the server.
 * 
 * NOTE: licenseCache will keep an array of ['mutex#id', license], to be used for searches from server log clicks.
 * The licenseCache will contain only the licenses from last 50k disconnected players, which should be one entire
 *  session for the q99.9 servers out there and weight around 4mb.
 * The idea is: all players with license will be in the database, so storing only license is enough to find them.
 * 
 * NOTE: #playerlist keeps all players in this session, a heap snapshot revealed that an 
 *  average player (no actions) will weight about 520 bytes, and the q9999 of max netid is ~22k, 
 *  meaning that for 99.99 of the servers, the list will be under 11mb.
 * A list with 50k connected players will weight around 26mb, meaning no optimization is required there.
 */
export default class PlayerlistManager {
    readonly #txAdmin: TxAdmin;
    #playerlist: (ServerPlayer | undefined)[] = [];
    licenseCache: [mutexid: string, license: string][] = [];
    licenseCacheLimit = 50_000; //mutex+id+license * 50_000 = ~4mb
    joinLeaveLog: [ts: number, isJoin: boolean][] = [];
    joinLeaveLogLimitTime = 30 * 60 * 1000; //30 mins, [ts+isJoin] * 100_000 = ~4.3mb

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
    }


    /**
     * Number of online/connected players.
     */
    get onlineCount() {
        return this.#playerlist.filter(p => p && p.isConnected).length;
    }


    /**
     * Number of players that joined/left in the last hour.
     */
    get joinLeaveTally() {
        let toRemove = 0;
        const out = { joined: 0, left: 0 };
        const tsWindowStart = Date.now() - this.joinLeaveLogLimitTime;
        for (const [ts, isJoin] of this.joinLeaveLog) {
            if (ts > tsWindowStart) {
                out[isJoin ? 'joined' : 'left']++;
            } else {
                toRemove++;
            }
        }
        this.joinLeaveLog.splice(0, toRemove);
        return out;
    }


    /**
     * Handler for server restart - it will kill all players
     * We MUST do .disconnect() for all players to clear the timers.
     * NOTE: it's ok for us to overfill before slicing the licenseCache because it's at most ~4mb
     */
    handleServerStop(oldMutex: string) {
        for (const player of this.#playerlist) {
            if (player) {
                player.disconnect();
                if (player.license) {
                    this.licenseCache.push([`${oldMutex}#${player.netid}`, player.license]);
                }
            }
        }
        this.licenseCache = this.licenseCache.slice(-this.licenseCacheLimit);
        this.#playerlist = [];
        this.joinLeaveLog = [];
        this.#txAdmin.webServer.webSocket!.buffer('playerlist', {
            mutex: oldMutex,
            type: 'fullPlayerlist',
            playerlist: [],
        });
    }


    /**
     * To guarantee multiple instances of the same player license have their dbData synchronized,
     * this function (called by playerDatabase.updatePlayer) goes through every matching player 
     * (except the source itself) to update their dbData.
     */
    handleDbDataSync(dbData: DatabasePlayerType, srcUniqueId: Symbol) {
        for (const player of this.#playerlist) {
            if (
                player instanceof ServerPlayer
                && player.isRegistered
                && player.license === dbData.license
                && player.uniqueId !== srcUniqueId
            ) {
                player.syncUpstreamDbData(dbData);
            }
        }
    }


    /**
     * Returns a playerlist array with ServerPlayer data of all connected players.
     * The data is cloned to prevent pollution.
     */
    getPlayerList() {
        return this.#playerlist
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
     * Returns a specifc ServerPlayer or undefined.
     * NOTE: this returns the actual object and not a deep clone!
     */
    getPlayerById(netid: number) {
        return this.#playerlist[netid];
    }

    /**
     * Returns a specifc ServerPlayer or undefined.
     * NOTE: this returns the actual object and not a deep clone!
     */
    getOnlinePlayersByLicense(searchLicense: string) {
        return this.#playerlist.filter(p => p && p.license === searchLicense && p.isConnected) as ServerPlayer[];
    }

    /**
     * Returns a set of all online players' licenses.
     */
    getOnlinePlayersLicenses() {
        return new Set(this.#playerlist.filter(p => p && p.isConnected).map(p => p!.license));
    }

    /**
     * Receives initial data callback from ServerPlayer and dispatches to the server as stdin.
     */
    dispatchInitialPlayerData(playerId: number, pendingWarn: DatabaseActionWarnType) {
        const cmdData = {
            netId: playerId,
            pendingWarn: {
                author: pendingWarn.author,
                reason: pendingWarn.reason,
                actionId: pendingWarn.id,
                targetNetId: playerId,
                targetIds: pendingWarn.ids, //not used in the playerWarned handler
                targetName: pendingWarn.playerName,
            }
        }
        this.#txAdmin.fxRunner.sendCommand('txaInitialData', [cmdData]);
    }


    /**
     * Handler for all txAdminPlayerlistEvent structured trace events
     * TODO: use zod for type safety
     */
    async handleServerEvents(payload: any, mutex: string) {
        const currTs = Date.now();
        if (payload.event === 'playerJoining') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (this.#playerlist[payload.id] !== undefined) throw new Error(`duplicated player id`);
                //TODO: pass serverInstance instead of playerDatabase
                const svPlayer = new ServerPlayer(payload.id, payload.player, this, this.#txAdmin.playerDatabase);
                this.#playerlist[payload.id] = svPlayer;
                this.joinLeaveLog.push([currTs, true]);
                this.#txAdmin.logger.server.write([{
                    type: 'playerJoining',
                    src: payload.id,
                    ts: currTs,
                    data: { ids: this.#playerlist[payload.id]!.ids }
                }], mutex);
                this.#txAdmin.webServer.webSocket.buffer<PlayerJoiningEventType>('playerlist', {
                    mutex,
                    type: 'playerJoining',
                    netid: svPlayer.netid,
                    displayName: svPlayer.displayName,
                    pureName: svPlayer.pureName,
                    ids: svPlayer.ids,
                    license: svPlayer.license,
                });
            } catch (error) {
                console.verbose.warn(`playerJoining event error: ${(error as Error).message}`);
            }

        } else if (payload.event === 'playerDropped') {
            try {
                if (typeof payload.id !== 'number') throw new Error(`invalid player id`);
                if (!(this.#playerlist[payload.id] instanceof ServerPlayer)) throw new Error(`player id not found`);
                this.#playerlist[payload.id]!.disconnect();
                this.joinLeaveLog.push([currTs, false]);
                const reasonCategory = this.#txAdmin.statsManager.playerDrop.handlePlayerDrop(payload);
                if (reasonCategory !== false) {
                    this.#txAdmin.logger.server.write([{
                        type: 'playerDropped',
                        src: payload.id,
                        ts: currTs,
                        data: { reason: payload.reason }
                    }], mutex);
                }
                this.#txAdmin.webServer.webSocket.buffer<PlayerDroppedEventType>('playerlist', {
                    mutex,
                    type: 'playerDropped',
                    netid: this.#playerlist[payload.id]!.netid,
                    reasonCategory: reasonCategory ? reasonCategory : undefined,
                });
            } catch (error) {
                console.verbose.warn(`playerDropped event error: ${(error as Error).message}`);
            }
        } else {
            console.warn(`Invalid event: ${payload?.event}`);
        }
    }
};
