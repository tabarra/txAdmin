import { cloneDeep } from 'lodash-es';
import { DbInstance, SavePriority } from "../instance";
import { DatabasePlayerType } from "../databaseTypes";
import { DuplicateKeyError } from "../dbUtils";
import consoleFactory from '@lib/console';
const console = consoleFactory('DatabaseDao');


/**
 * Data access object for the database "players" collection.
 */
export default class PlayersDao {
    constructor(private readonly db: DbInstance) { }

    private get dbo() {
        if (!this.db.obj || !this.db.isReady) throw new Error(`database not ready yet`);
        return this.db.obj;
    }

    private get chain() {
        if (!this.db.obj || !this.db.isReady) throw new Error(`database not ready yet`);
        return this.db.obj.chain;
    }


    /**
     * Searches for a player in the database by the license, returns null if not found or false in case of error
     */
    findOne(license: string): DatabasePlayerType | null {
        if (!/[0-9A-Fa-f]{40}/.test(license)) {
            throw new Error('Invalid reference type');
        }

        //Performing search
        const p = this.chain.get('players')
            .find({ license })
            .cloneDeep()
            .value();
        return (typeof p === 'undefined') ? null : p;
    }


    /**
     * Register a player to the database
     */
    findMany(filter: object | Function): DatabasePlayerType[] {
        return this.chain.get('players')
            .filter(filter as any)
            .cloneDeep()
            .value();
    }


    /**
     * Register a player to the database
     */
    register(player: DatabasePlayerType): void {
        //TODO: validate player data vs DatabasePlayerType props

        //Check for duplicated license
        const found = this.chain.get('players')
            .filter({ license: player.license })
            .value();
        if (found.length) throw new DuplicateKeyError(`this license is already registered`);

        this.db.writeFlag(SavePriority.LOW);
        this.chain.get('players')
            .push(player)
            .value();
    }


    /**
     * Updates a player setting assigning srcData props to the database player.
     * The source data object is deep cloned to prevent weird side effects.
     */
    update(license: string, srcData: object, srcUniqueId: Symbol): DatabasePlayerType {
        if (typeof (srcData as any).license !== 'undefined') {
            throw new Error(`cannot license field`);
        }

        const playerDbObj = this.chain.get('players').find({ license });
        if (!playerDbObj.value()) throw new Error('Player not found in database');
        this.db.writeFlag(SavePriority.LOW);
        const newData = playerDbObj
            .assign(cloneDeep(srcData))
            .cloneDeep()
            .value();
        txCore.fxPlayerlist.handleDbDataSync(newData, srcUniqueId);
        return newData;
    }


    /**
     * Revokes whitelist status of all players that match a filter function
     * @returns the number of revoked whitelists
     */
    bulkRevokeWhitelist(filterFunc: Function): number {
        if (typeof filterFunc !== 'function') throw new Error('filterFunc must be a function.');

        let cntChanged = 0;
        const srcSymbol = Symbol('bulkRevokePlayerWhitelist');
        this.dbo.data!.players.forEach((player) => {
            if (player.tsWhitelisted && filterFunc(player)) {
                cntChanged++;
                player.tsWhitelisted = undefined;
                txCore.fxPlayerlist.handleDbDataSync(cloneDeep(player), srcSymbol);
            }
        });

        this.db.writeFlag(SavePriority.HIGH);
        return cntChanged;
    }
}
