import { SYM_CURRENT_MUTEX } from "@lib/symbols.js";
import { DatabasePlayer, ServerPlayer } from "./playerClasses.js"


/**
 * Resolves a ServerPlayer or DatabasePlayer based on mutex, netid and license.
 * When mutex#netid is present, it takes precedence over license.
 * If the mutex is not from the current server, search for the license in FxPlayerlist.licenseCache[]
 * and then search for the license in the database.
 */
export default (mutex: any, netid: any, license: any) => {
    const parsedNetid = parseInt(netid);
    let searchLicense = license;

    //For error clarification only
    let hasMutex = false;

    //Attempt to resolve current mutex, if needed
    if(mutex === SYM_CURRENT_MUTEX){
        mutex = txCore.fxRunner.child?.mutex;
        if (!mutex) {
            throw new Error(`current mutex not available`);
        }
    }

    //If mutex+netid provided
    if (typeof mutex === 'string' && typeof netid === 'number' && !isNaN(parsedNetid)) {
        hasMutex = true;
        if (mutex && mutex === txCore.fxRunner.child?.mutex) {
            //If the mutex is from the server currently online
            const player = txCore.fxPlayerlist.getPlayerById(netid);
            if (player instanceof ServerPlayer) {
                return player;
            } else {
                throw new Error(`player not found in current server playerlist`);
            }
        } else {
            // If mutex is from previous server, overwrite any given license
            const searchRef = `${mutex}#${netid}`;
            const found = txCore.fxPlayerlist.licenseCache.find(c => c[0] === searchRef);
            if (found) searchLicense = found[1];
        }
    }

    //If license provided or resolved through licenseCache, search in the database
    if (typeof searchLicense === 'string' && searchLicense.length) {
        const onlineMatches = txCore.fxPlayerlist.getOnlinePlayersByLicense(searchLicense);
        if(onlineMatches.length){
            return onlineMatches.at(-1) as ServerPlayer;
        }else{
            return new DatabasePlayer(searchLicense);
        }
    }

    //Player not found
    //If not found in the db, the search above already threw error
    if(hasMutex){
        throw new Error(`could not resolve player by its net id which likely means it has disconnected long ago`);
    }else{
        throw new Error(`could not resolve this player`);
    }
} 
