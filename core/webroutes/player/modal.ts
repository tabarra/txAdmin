const modulename = 'WebServer:PlayerModal';
import dateFormat from 'dateformat';
import playerResolver from '@core/playerLogic/playerResolver';
import { PlayerHistoryItem, PlayerModalResp, PlayerModalPlayerData } from '@shared/playerApiTypes';
import { DatabaseActionType } from '@core/components/PlayerDatabase/databaseTypes';
import { ServerPlayer } from '@core/playerLogic/playerClasses';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import { now } from '@extras/helpers';
import { getBanTemplatesImpl } from '../banTemplates/getBanTemplates';
const console = consoleFactory(modulename);

//Helpers
const processHistoryLog = (hist: DatabaseActionType[]) => {
    try {
        return hist.map((log): PlayerHistoryItem => {
            return {
                id: log.id,
                type: log.type,
                reason: log.reason,
                author: log.author,
                ts: log.timestamp,
                exp: log.expiration ? log.expiration : undefined,
                revokedBy: log.revocation.author ? log.revocation.author : undefined,
                revokedAt: log.revocation.timestamp ? log.revocation.timestamp : undefined,
            };
        });
    } catch (error) {
        console.error(`Error processing player history: ${(error as Error).message}`);
        return [];
    }
};


/**
 * Returns the data for the player's modal
 * NOTE: sending license instead of id to be able to show data even for offline players
 */
export default async function PlayerModal(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.query === 'undefined') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const { mutex, netid, license } = ctx.query;
    const sendTypedResp = (data: PlayerModalResp) => ctx.send(data);

    //Finding the player
    let player;
    try {
        const refMutex = (mutex === 'current') ? ctx.txAdmin.fxRunner.currentMutex : mutex;
        player = playerResolver(refMutex, parseInt((netid as string)), license);
    } catch (error) {
        return sendTypedResp({ error: (error as Error).message });
    }

    //Prepping player data
    const playerData: PlayerModalPlayerData = {
        displayName: player.displayName,
        pureName: player.pureName,
        isRegistered: player.isRegistered,
        isConnected: player.isConnected,
        license: player.license,
        ids: player.ids,
        hwids: player.hwids,
        actionHistory: processHistoryLog(player.getHistory()),
    }

    if (player instanceof ServerPlayer) {
        playerData.netid = player.netid;
        playerData.sessionTime = Math.ceil((now() - player.tsConnected) / 60);
    }

    const playerDbData = player.getDbData();
    if (playerDbData) {
        playerData.tsJoined = playerDbData.tsJoined;
        playerData.playTime = playerDbData.playTime;
        playerData.tsWhitelisted = playerDbData.tsWhitelisted ? playerDbData.tsWhitelisted : undefined;
        playerData.oldIds = playerDbData.ids;
        playerData.oldHwids = playerDbData.hwids;
        playerData.tsLastConnection = playerDbData.tsLastConnection;

        if (playerDbData.notes?.lastAdmin && playerDbData.notes?.tsLastEdit) {
            playerData.notes = playerDbData.notes.text;
            const lastEditObj = new Date(playerDbData.notes.tsLastEdit * 1000);
            const lastEditString = dateFormat(lastEditObj, 'longDate');
            playerData.notesLog = `Last modified by ${playerDbData.notes.lastAdmin} at ${lastEditString}`;
        }
    }

    // console.dir(metaFields);
    // console.dir(playerData);
    return sendTypedResp({
        serverTime: now(),
        banTemplates: getBanTemplatesImpl(ctx), //TODO: move this to websocket push
        player: playerData
    });
};
