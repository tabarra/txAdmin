const modulename = 'PlayerDatabase';
import { Database } from './database';
import TxAdmin from '@core/txAdmin.js';
import consoleFactory from '@lib/console';

import PlayersDao from './dao/players';
import ActionsDao from './dao/actions';
import WhitelistDao from './dao/whitelist';
import StatsDao from './dao/stats';
import CleanupDao from './dao/cleanup';
const console = consoleFactory(modulename);


//Types
type PlayerDbConfigType = {
    onJoinCheckBan: boolean;
    whitelistMode: 'disabled' | 'adminOnly' | 'guildMember' | 'guildRoles' | 'approvedLicense';
    whitelistedDiscordRoles: string[];
    whitelistRejectionMessage: string;
    requiredBanHwidMatches: number;
    banRejectionMessage: string;
}


/**
 * Provide a central database for players, as well as assist with access control.
 */
export default class PlayerDatabase {
    readonly #db: Database;
    readonly #txAdmin: TxAdmin;

    //Database Methods
    readonly players: PlayersDao;
    readonly actions: ActionsDao;
    readonly whitelist: WhitelistDao;
    readonly stats: StatsDao;
    readonly cleanup: CleanupDao;

    constructor(txAdmin: TxAdmin, public config: PlayerDbConfigType) {
        this.#txAdmin = txAdmin;
        //Checking config validity
        if (this.config.requiredBanHwidMatches < 0 || this.config.requiredBanHwidMatches > 6) {
            throw new Error('The playerDatabase.requiredBanHwidMatches setting must be between 0 (disabled) and 6.');
        }

        this.#db = new Database();
        this.players = new PlayersDao(txAdmin, this.#db);
        this.actions = new ActionsDao(txAdmin, this.#db);
        this.whitelist = new WhitelistDao(txAdmin, this.#db);
        this.stats = new StatsDao(txAdmin, this.#db);
        this.cleanup = new CleanupDao(txAdmin, this.#db);

        //Database optimization cron function
        setTimeout(() => {
            this.cleanup.runDailyOptimizer();
        }, 30_000);
        setInterval(() => {
            this.cleanup.runDailyOptimizer();
        }, 24 * 60 * 60_000);
    }


    /**
     * Returns if the lowdb instance is ready
     */
    get isReady() {
        return this.#db.isReady;
    }

    /**
     * Refresh configurations
     */
    refreshConfig() {
        this.config = this.#txAdmin.configVault.getScoped('playerDatabase');
    }

    /**
     * Returns the entire lowdb object. Please be careful with it :)
     */
    getDboRef() {
        if (!this.#db.obj) throw new Error(`database not ready yet`);
        return this.#db.obj;
    }
};
