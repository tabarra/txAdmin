import FXRunner from "@core/components/FxRunner/index.js";
import PlayerDatabase from "@core/components/PlayerDatabase/index.js";
import PlayerlistManager from "@core/components/PlayerlistManager/index.js";
import { DatabasePlayer, ServerPlayer } from "./playerClasses.js"

/**
 * Resolves a ServerPlayer or DatabasePlayer based on mutex, netid and license.
 * When mutex#netid is present, it takes precedence over license.
 * If the mutex is not from the current server, search for the license in playerlistManager.licenseCache[]
 * and then search for the license in the database.
 * 
 * FIXME: pass serverInstance when multiserver
 */
export default (mutex: any, netid: any, license: any) => {
    //TODO: remove when removing globals
    const fxRunner = (globals.fxRunner as FXRunner);
    const playerlistManager = (globals.playerlistManager as PlayerlistManager);
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);

    const parsedNetid = parseInt(netid);
    let searchLicense = license;

    //If mutex+netid provided
    if (typeof mutex === 'string' && typeof netid === 'number' && !isNaN(parsedNetid)) {
        if (mutex === fxRunner?.currentMutex) {
            //If the mutex is from the server currently online
            const player = playerlistManager.playerlist[netid];
            if (player instanceof ServerPlayer) {
                return player;
            } else {
                throw new Error(`player not found in current server playerlist`);
            }
        } else {
            // If mutex is from previous server, overwrite any given license
            const searchRef = `${mutex}#${netid}`;
            const found = playerlistManager.licenseCache.find(c => c[0] === searchRef);
            if (found) searchLicense = found[1];
        }
    }

    //If license provided or resolved through licenseCache, search in the database
    if (typeof searchLicense === 'string' && searchLicense.length) {
        return new DatabasePlayer(searchLicense, playerDatabase)
    } else {
        throw new Error(`this player is not connected to the server and has no license identifier`);
    }
} 
