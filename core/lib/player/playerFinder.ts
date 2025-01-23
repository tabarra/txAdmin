import { DatabasePlayerType } from "@modules/Database/databaseTypes.js";
import { DatabasePlayer } from "./playerClasses.js"


/**
 * Finds all players in the database with a particular matching identifier
 */
export const findPlayersByIdentifier = (identifier: string): DatabasePlayer[] => {
    if(typeof identifier !== 'string' || !identifier.length) throw new Error(`invalid identifier`);

    const filter = (player: DatabasePlayerType) => player.ids.includes(identifier);
    const playersData = txCore.database.players.findMany(filter);

    return playersData.map((dbData) => new DatabasePlayer(dbData.license, dbData))
} 
