const modulename = 'Metrics';
import consoleFactory from '@lib/console';
import SvRuntimeMetrics from './svRuntime';
import TxRuntimeMetrics from './txRuntime';
import PlayerDropMetrics from './playerDrop';
import type { UpdateConfigKeySet } from '@modules/ConfigStore/utils';
const console = consoleFactory(modulename);


/**
 * Module responsible to collect statistics and data.  
 * It is broken down into sub-modules for each specific area.
 */
export default class Metrics {
    static readonly configKeysWatched = [
        'server.dataPath',
        'server.cfgPath',
        'whitelist.mode',
    ];

    public readonly svRuntime: SvRuntimeMetrics;
    public readonly txRuntime: TxRuntimeMetrics;
    public readonly playerDrop: PlayerDropMetrics;

    constructor() {
        this.svRuntime = new SvRuntimeMetrics();
        this.txRuntime = new TxRuntimeMetrics();
        this.playerDrop = new PlayerDropMetrics();
    }

    /**
     * Handle updates to the config by resetting the required metrics
     */
    public handleConfigUpdate(updatedConfigs: UpdateConfigKeySet) {
        //TxRuntime
        if(updatedConfigs.hasMatch('whitelist.mode')){
            txCore.metrics.txRuntime.whitelistCheckTime.clear();
        }

        //PlayerDrop
        const hasServerDataChanged = updatedConfigs.hasMatch('server.dataPath');
        const hasServerCfgChanged = updatedConfigs.hasMatch('server.cfgPath');
        let pdlResetMsgPart: string | undefined;
        if(hasServerDataChanged && hasServerCfgChanged){
            pdlResetMsgPart = 'Data Path and CFG Path';
        } else if (hasServerDataChanged){
            pdlResetMsgPart = 'Data Path';
        } else if (hasServerCfgChanged){
            pdlResetMsgPart = 'CFG Path';
        }
        if (pdlResetMsgPart) {
            this.playerDrop.resetLog(`Server ${pdlResetMsgPart} changed.`);
        }
    }
};
