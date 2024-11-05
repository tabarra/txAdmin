const modulename = 'StatsManager';
import consoleFactory from '@lib/console';
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

    constructor() {
        this.svRuntime = new SvRuntimeStatsManager();
        this.txRuntime = new TxRuntimeStatsManager();
        this.playerDrop = new PlayerDropStatsManager();
    }
};
