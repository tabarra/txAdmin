const modulename = 'Metrics';
import consoleFactory from '@lib/console';
import SvRuntimeMetrics from './svRuntime';
import TxRuntimeMetrics from './txRuntime';
import PlayerDropMetrics from './playerDrop';
const console = consoleFactory(modulename);


/**
 * Module responsible to collect statistics and data.
 * It is broken down into sub-modules for each specific area.
 * NOTE: yes, this could just have been an object, but who cares.
 */
export default class Metrics {
    public readonly svRuntime: SvRuntimeMetrics;
    public readonly txRuntime: TxRuntimeMetrics;
    public readonly playerDrop: PlayerDropMetrics;

    constructor() {
        this.svRuntime = new SvRuntimeMetrics();
        this.txRuntime = new TxRuntimeMetrics();
        this.playerDrop = new PlayerDropMetrics();
    }
};
