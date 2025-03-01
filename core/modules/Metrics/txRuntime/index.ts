const modulename = 'TxRuntimeMetrics';
import * as jose from 'jose';
import consoleFactory from '@lib/console';
import { MultipleCounter, QuantileArray } from '../statsUtils';
import { txEnv, txHostConfig } from '@core/globalData';
import { getHostStaticData } from '@lib/diagnostics';
import fatalError from '@lib/fatalError';
const console = consoleFactory(modulename);


//Consts
const JWE_VERSION = 13;
const statsPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2NCbB5DvpR7F8qHF9SyA
xJKv9lpGO2PiU5wYUmEQaa0IUrUZmQ8ivsoOyCZOGKN9PESsVyqZPx37fhtAIqNo
AXded6K6ortngEghqQloK3bi3hk8mclGXKmUhwimfrw77EIzd8dycSFQTwV+hiy6
osF2150yfeGRnD1vGbc6iS7Ewer0Zh9rwghXnl/jTupVprQggrhVIg62ZxmrQ0Gd
lj9pVXSu6QV/rjNbAVIiLFBGTjsHIKORQWV32oCguXu5krNvI+2lCBpOowY2dTO/
+TX0xXHgkGAQIdL0SdpD1SIe57hZsA2mOVitNwztE+KAhYsVBSqasGbly0lu7NDJ
oQIDAQAB
-----END PUBLIC KEY-----`;
const jweHeader = {
    alg: 'RSA-OAEP-256',
    enc: 'A256GCM',
    kid: '2023-05-21_stats'
} satisfies jose.CompactJWEHeaderParameters;

/**
 * Responsible for collecting server runtime statistics
 * NOTE: the register functions don't throw because we rather break stats than txAdmin itself
 */
export default class TxRuntimeMetrics {
    #publicKey: jose.KeyLike | undefined;

    #fxServerBootSeconds: number | false = false;
    public readonly loginOrigins = new MultipleCounter();
    public readonly loginMethods = new MultipleCounter();
    public readonly botCommands = new MultipleCounter();
    public readonly menuCommands = new MultipleCounter();
    public readonly banCheckTime = new QuantileArray(5000, 50);
    public readonly whitelistCheckTime = new QuantileArray(5000, 50);
    public readonly playersTableSearchTime = new QuantileArray(5000, 50);
    public readonly historyTableSearchTime = new QuantileArray(5000, 50);
    public readonly databaseSaveTime = new QuantileArray(1440, 60);
    public readonly perfCollectionTime = new QuantileArray(1440, 60);
    
    public currHbData: string = '{"error": "not yet initialized in TxRuntimeMetrics"}';
    public monitorStats = {
        healthIssues: {
            fd3: 0,
            http: 0,
        },
        restartReasons: {
            bootTimeout: 0,
            close: 0,
            heartBeat: 0,
            healthCheck: 0,
            both: 0,
        },
    };

    constructor() {
        setImmediate(() => {
            this.loadStatsPublicKey();
        });

        //Delaying this because host static data takes 10+ seconds to be set
        setTimeout(() => {
            this.refreshHbData().catch((e) => { });
        }, 15_000);

        //Cron function
        setInterval(() => {
            this.refreshHbData().catch((e) => { });
        }, 60_000);
    }


    /**
     * Parses the stats public key
     */
    async loadStatsPublicKey() {
        try {
            this.#publicKey = await jose.importSPKI(statsPublicKeyPem, 'RS256');
        } catch (error) {
            fatalError.StatsTxRuntime(0, 'Failed to load stats public key.', error);
        }
    }


    /**
     * Called by FxMonitor to keep track of the last boot time
     */
    registerFxserverBoot(seconds: number) {
        if (!Number.isInteger(seconds) || seconds < 0) {
            this.#fxServerBootSeconds = false;
        }
        this.#fxServerBootSeconds = seconds;
        console.verbose.debug(`FXServer booted in ${seconds} seconds.`);
    }


    /**
     * Called by FxMonitor to keep track of the fxserver restart reasons
     */
    registerFxserverRestart(reason: keyof typeof this.monitorStats.restartReasons) {
        if (!(reason in this.monitorStats.restartReasons)) return;
        this.monitorStats.restartReasons[reason]++;
    }


    /**
     * Called by FxMonitor to keep track of the fxserver HB/HC failures
     */
    registerFxserverHealthIssue(type: keyof typeof this.monitorStats.healthIssues) {
        if (!(type in this.monitorStats.healthIssues)) return;
        this.monitorStats.healthIssues[type]++;
    }


    /**
     * Processes general txadmin stuff to generate the HB data.
     * 
     * Stats Version Changelog:
     * 6: added txStatsData.randIDFailures
     * 7: changed web folder paths, which affect txStatsData.pageViews
     * 8: removed discordBotStats and whitelistEnabled
     * 9: totally new format
     * 9: for tx v7, loginOrigin dropped the 'webpipe' and 'cfxre', 
     *    and loginMethods dropped 'nui' and 'iframe'
     *    Did not change the version because its fully compatible.
     * 10: deprecated pageViews because of the react migration
     * 11: added playersTableSearchTime and historyTableSearchTime
     * 12: changed perfSummary format
     * 13: added providerName
     * 
     * TODO:
     * Use the average q5 and q95 to find out the buckets.
     * Then start sending the buckets with counts instead of quantiles.
     * Might be ok to optimize by joining both arrays, even if the buckets are not the same
     * joinCheckTimes: [
     *     [ban, wl], //bucket 1
     *     [ban, wl], //bucket 2
     *     ...
     * ]
     */
    async refreshHbData() {
        //Make sure publicKey is loaded
        if (!this.#publicKey) {
            console.verbose.warn('Cannot refreshHbData because this.#publicKey is not set.');
            return;
        }

        //Generate HB data
        try {
            const hostData = getHostStaticData();

            //Prepare stats data
            const statsData = {
                //Static
                providerName: txHostConfig.providerName,
                isZapHosting: txEnv.isZapHosting,
                isPterodactyl: txEnv.isPterodactyl,
                osDistro: hostData.osDistro,
                hostCpuModel: `${hostData.cpu.manufacturer} ${hostData.cpu.brand}`,

                //Passive runtime data
                fxServerBootSeconds: this.#fxServerBootSeconds,
                loginOrigins: this.loginOrigins,
                loginMethods: this.loginMethods,
                botCommands: txConfig.discordBot.enabled
                    ? this.botCommands
                    : false,
                menuCommands: txConfig.gameFeatures.menuEnabled
                    ? this.menuCommands
                    : false,
                banCheckTime: txConfig.banlist.enabled
                    ? this.banCheckTime
                    : false,
                whitelistCheckTime: txConfig.whitelist.mode !== 'disabled'
                    ? this.whitelistCheckTime
                    : false,
                playersTableSearchTime: this.playersTableSearchTime,
                historyTableSearchTime: this.historyTableSearchTime,

                //Settings & stuff
                adminCount: Array.isArray(txCore.adminStore.admins) ? txCore.adminStore.admins.length : 1,
                banCheckingEnabled: txConfig.banlist.enabled,
                whitelistMode: txConfig.whitelist.mode,
                recipeName: txCore.cacheStore.get('deployer:recipe') ?? 'not_in_cache',
                tmpConfigFlags: Object.entries(txConfig.gameFeatures)
                    .filter(([key, value]) => value)
                    .map(([key]) => key),

                //Processed stuff
                playerDb: txCore.database.stats.getDatabaseStats(),
                perfSummary: txCore.metrics.svRuntime.getServerPerfSummary(),
            };

            //Prepare output
            const encodedHbData = new TextEncoder().encode(JSON.stringify(statsData));
            const jwe = await new jose.CompactEncrypt(encodedHbData)
                .setProtectedHeader(jweHeader)
                .encrypt(this.#publicKey);
            this.currHbData = JSON.stringify({ '$statsVersion': JWE_VERSION, jwe });
        } catch (error) {
            console.verbose.error('Error while updating stats data.');
            console.verbose.dir(error);
            this.currHbData = JSON.stringify({ error: (error as Error).message });
        }
    }
};
