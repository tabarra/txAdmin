const modulename = 'PerformanceCollector';
import fse from 'fs-extra';
import * as d3array from 'd3-array';
import { convars } from '@core/globalData';
import { parsePerf, diffPerfs, validatePerfThreadData, validatePerfCacheData } from './perfUtils.js';
import got from '@core/extras/got.js';
// import TimeSeries from './timeSeries.js'; //NOTE: may still use for the player counter
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


//Helper functions
const getEpoch = (mod, ts = false) => {
    const time = ts ? new Date(ts) : new Date();
    const minutes = Math.floor(time.getMinutes() / mod) * mod;
    return String(time.getHours()).padStart(2, '0') + String(minutes).padStart(2, '0');
};


export default class PerformanceCollector {
    constructor() {
        // this.playersTimeSeries = new TimeSeries(`${globals.info.serverProfilePath}/data/players.json`, 10, 60*60*24);
        this.hardConfigs = {
            heatmapDataFile: `${globals.info.serverProfilePath}/data/stats_heatmapData_v1.json`,
            playerCountFile: `${globals.info.serverProfilePath}/data/stats_playerCount_v1.json`,
            performance: {
                resolution: 5,
                // lengthCap: 288, //5*288 = 1440 = 1 day
                lengthCap: 360, //5*360 = 30 hours
            },
        };
        // this.playersBuffer = [];
        // this.playersSeries = [];
        this.perfSeries = null;
        this.loadPerformanceHistory();

        //Cron functions
        setInterval(async () => {
            try {
                await this.collectPerformance();
            } catch (error) {
                console.verbose.warn('Error while collecting fxserver performance data');
                console.verbose.dir(error);
            }
        }, 60 * 1000);
    }


    /**
     * Loads the database/cache/history for the performance heatmap
     */
    async loadPerformanceHistory() {
        let rawFile = null;
        try {
            rawFile = await fse.readFile(this.hardConfigs.heatmapDataFile, 'utf8');
        } catch (error) { }

        const setFile = async () => {
            try {
                await fse.writeFile(this.hardConfigs.heatmapDataFile, '[]');
                this.perfSeries = [];
            } catch (error) {
                console.error(`Unable to create stats_heatmapData_v1 with error: ${error.message}`);
                process.exit(5500);
            }
        };

        if (rawFile !== null) {
            try {
                const heatmapData = JSON.parse(rawFile);
                if (!Array.isArray(heatmapData)) throw new Error('data is not an array');
                if (!validatePerfCacheData(heatmapData)) throw new Error('invalid data in cache');
                this.perfSeries = heatmapData.slice(-this.hardConfigs.performance.lengthCap);
            } catch (error) {
                console.warn(`Failed to load stats_heatmapData_v1 with message: ${error.message}`);
                console.warn('Since this is not a critical file, it will be reset.');
                await setFile();
            }
        } else {
            await setFile();
        }
    }


    /**
     * TODO:
     * Cron function to collect the player count from fxserver.
     * The objective is to collect 1 week of data with 1 minute resolution.
     */
    collectPlayers() {
        return 'not implemented yet';

        // check if server is offline
        // const epoch = getEpoch(1);
        // const lastReg = this.playersSeries.length ? this.playersSeries[this.playersSeries.length-1] : false;
        // if(lastReg && lastReg.epoch !== epoch){
        //     this.playersSeries = this.playersSeries.map(e => {

        //     })
        // }
        // const playerlist = globals.playerlistManager.getPlayerList();
        // this.playersTimeSeries.add(playerlist.length);
        // console.dir(playerlist.length)
    }


    /**
     * Returns a summary of the collected data and returns.
     * Format: { medianPlayers: number, epochs: number, buckets: number[] } | null
     */
    getSummary(threadName) {
        if (this.perfSeries === null) return;
        const availableThreads = ['svNetwork', 'svSync', 'svMain'];
        if (!availableThreads.includes(threadName)) throw new Error('unknown thread name');

        //Getting snapshots
        const snapsPerHour = 60 / this.hardConfigs.performance.resolution;
        const minSnapshots = 4 * snapsPerHour;
        const maxDeltaTime = 30 * snapsPerHour; //30 hours
        const relevantSnapshots = this.perfSeries.slice(-maxDeltaTime);
        if (relevantSnapshots.length < minSnapshots) {
            return null; //not enough data for meaningful analysis
        }

        //that's short for cumulative buckets 😏
        const cumBuckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let cumTicks = 0;

        //Processing each snapshot - then each bucket
        for (const snapshop of relevantSnapshots) {
            for (let bIndex = 0; bIndex < 15; bIndex++) {
                const prevBucket = (bIndex) ? snapshop.perfSrc[threadName].buckets[bIndex - 1] : 0;
                const tickCount = snapshop.perfSrc[threadName].buckets[bIndex] - prevBucket;
                cumTicks += tickCount;
                cumBuckets[bIndex] += tickCount;
            }
        }

        //Formatting Output
        return {
            buckets: cumBuckets.map(ticks => ticks / cumTicks),
            medianPlayers: d3array.median(relevantSnapshots, x => x.clients),
            epochs: relevantSnapshots.length,
        };
    }


    /**
     * Cron function to collect the performance data from fxserver.
     * This function will also collect player count and process the perf history.
     *
     * NOTE:
     * a cada 1 minuto coleta:
     *     - se o último epoch = epoch atual, ignora
     *     - coleta perf
     *     - coleta players count
     *
     * dessa forma:
     *     - em vai ter 5 chances de se coletar cada epoch
     *     - normalmente o timestamp do coletado vai ser com o epoch correto
     *     - não estamos fazendo média de players
     */
    async collectPerformance() {
        //Check pre-condition
        if (this.perfSeries === null) return;
        if (globals.fxRunner.fxChild === null) return;
        if (globals.playerlistManager === null) return;
        if (globals.healthMonitor.currentStatus !== 'ONLINE') return;

        //Commom vars
        const now = Date.now();
        const cfg = this.hardConfigs.performance; //Shorthand only
        const lastSnap = this.perfSeries.length ? this.perfSeries[this.perfSeries.length - 1] : false;

        //Check skip rules
        if (
            lastSnap
            && getEpoch(cfg.resolution, lastSnap.ts) === getEpoch(cfg.resolution)
            && now - lastSnap.ts < cfg.resolution * 60 * 1000
        ) {
            return;
        }

        //Get performance data
        const sourceURL = (convars.debugExternalSource) ? convars.debugExternalSource : globals.fxRunner.fxServerHost;
        const currPerfRaw = await got(`http://${sourceURL}/perf/`).text();
        const currPerfData = parsePerf(currPerfRaw);
        if (
            !validatePerfThreadData(currPerfData.svSync)
            || !validatePerfThreadData(currPerfData.svNetwork)
            || !validatePerfThreadData(currPerfData.svMain)
        ) {
            throw new Error('invalid or incomplete /perf/ response');
        }

        //Check if is linear or not (server reset or skipped epoch)
        const islinear = (
            lastSnap
            && now - lastSnap.ts <= cfg.resolution * 60 * 1000 * 4 //resolution time in ms * 4 -- just in case there is some lag
            && lastSnap.mainTickCounter < currPerfData.svMain.count
        );

        //Calculate the tick/time counts since last epoch
        const currPerfDiff = diffPerfs(currPerfData, (islinear) ? lastSnap.perfSrc : false);

        //ForEach thread, individualize tick counts (instead of CumSum) and calculates frequency
        Object.keys(currPerfDiff).forEach((thread) => {
            const bucketsFrequencies = [];
            currPerfDiff[thread].buckets.forEach((b, bIndex) => {
                const prevBucket = (bIndex) ? currPerfDiff[thread].buckets[bIndex - 1] : 0;
                const freq = (b - prevBucket) / currPerfDiff[thread].count;
                bucketsFrequencies.push(freq);
            });
            currPerfDiff[thread].buckets = bucketsFrequencies;
        });

        //Prepare snapshop object
        const currSnapshot = {
            ts: now,
            skipped: !islinear,
            mainTickCounter: currPerfData.svMain.count,
            clients: globals.playerlistManager.getPlayerList().length,
            perfSrc: currPerfData,
            perf: currPerfDiff,
        };

        //Push to cache
        this.perfSeries.push(currSnapshot);
        if (this.perfSeries.length > this.hardConfigs.performance.lengthCap) {
            this.perfSeries.shift();
        }

        //Save perf series do file
        try {
            await fse.outputJSON(this.hardConfigs.heatmapDataFile, this.perfSeries);
            console.verbose.ok(`Collected performance snapshot #${this.perfSeries.length}`);
        } catch (error) {
            console.verbose.warn('Failed to write the performance history log file with error:');
            console.verbose.dir(error);
        }
    }
};
