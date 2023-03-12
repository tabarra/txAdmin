import { DatabasePlayerType } from "@core/components/PlayerDatabase/databaseTypes.js";
import PlayerDatabase from "@core/components/PlayerDatabase/index.js";
import { DatabasePlayer } from "./playerClasses.js"


/**
 * Finds all players in the database with a particular matching identifier
 */
export const findPlayersByIdentifier = (identifier: string): DatabasePlayer[] => {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    if(typeof identifier !== 'string' || !identifier.length) throw new Error(`invalid identifier`);

    const filter = (player: DatabasePlayerType) => player.ids.includes(identifier);
    const playersData = playerDatabase.getPlayersByFilter(filter);

    return playersData.map((dbData) => new DatabasePlayer(dbData.license, playerDatabase, dbData))
} 
