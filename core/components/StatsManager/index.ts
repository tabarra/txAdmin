const modulename = 'StatsManager';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
import SvRuntimeStatsManager from './svRuntime';
import TxRuntimeStatsManager from './txRuntime';
import PlayerDropStatsManager from './playerDrop';
const console = consoleFactory(modulename);


/**
 * Module responsible to collect statistics and data.
 * It is broken down into sub-modules for each specific area.
 * NOTE: yes, this could just have been an object, but who cares.
 */
export default class StatsManager {
    public readonly svRuntime: SvRuntimeStatsManager;
    public readonly txRuntime: TxRuntimeStatsManager;
    public readonly playerDrop: PlayerDropStatsManager;

    constructor(txAdmin: TxAdmin) {
        this.svRuntime = new SvRuntimeStatsManager(txAdmin);
        this.txRuntime = new TxRuntimeStatsManager(txAdmin);
        this.playerDrop = new PlayerDropStatsManager(txAdmin);
    }
};
