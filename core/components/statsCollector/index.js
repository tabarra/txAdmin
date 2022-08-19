//Requires
const modulename = 'StatsCollector';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const got = require('../../extras/got');
const { parsePerf, diffPerfs, validatePerfThreadData, validatePerfCacheData } = require('./statsUtils.js');
// const TimeSeries = require('./timeSeries'); //NOTE: may still use for the player counter

//Helper functions
const getEpoch = (mod, ts = false) => {
    const time = ts ? new Date(ts) : new Date();
    const minutes = Math.floor(time.getMinutes() / mod) * mod;
    return String(time.getHours()).padStart(2, '0') + String(minutes).padStart(2, '0');
};


module.exports = class StatsCollector {
    constructor() {
        // this.playersTimeSeries = new TimeSeries(`${globals.info.serverProfilePath}/data/players.json`, 10, 60*60*24);
        this.hardConfigs = {
            heatmapDataFile: `${globals.info.serverProfilePath}/data/stats_heatmapData_v1.json`,
            playerCountFile: `${globals.info.serverProfilePath}/data/stats_playerCount_v1.json`,
            performance: {
                resolution: 5,
                // lenthCap: 288, //5*288 = 1440 = 1 day
                lenthCap: 360, //5*360 = 30 hours
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
                if (GlobalData.verbose) {
                    logError('Error while collecting fxserver performance data');
                    dir(error);
                }
            }
        }, 60 * 1000);
    }


    //================================================================
    /**
     * Loads the database/cache/history for the performance heatmap
     */
    async loadPerformanceHistory() {
        let rawFile = null;
        try {
            rawFile = await fs.readFile(this.hardConfigs.heatmapDataFile, 'utf8');
        } catch (error) {}

        const setFile = async () => {
            try {
                await fs.writeFile(this.hardConfigs.heatmapDataFile, '[]');
                this.perfSeries = [];
            } catch (error) {
                logError(`Unable to create stats_heatmapData_v1 with error: ${error.message}`);
                process.exit();
            }
        };

        if (rawFile !== null) {
            try {
                const heatmapData = JSON.parse(rawFile);
                if (!Array.isArray(heatmapData)) throw new Error('data is not an array');
                if (!validatePerfCacheData(heatmapData)) throw new Error('invalid data in cache');
                this.perfSeries = heatmapData;
            } catch (error) {
                logError(`Failed to load stats_heatmapData_v1 with message: ${error.message}`);
                logError('Since this is not a critical file, it will be reset.');
                await setFile();
            }
        } else {
            await setFile();
        }
    }


    //================================================================
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
        // const playerlist = globals.playerController.getPlayerList();
        // this.playersTimeSeries.add(playerlist.length);
        // dir(playerlist.length)
    }


    //================================================================
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

        //Commom vars
        const now = Date.now();
        const cfg = this.hardConfigs.performance; //Shorthand only
        const lastSnap = this.perfSeries.length ? this.perfSeries[this.perfSeries.length - 1] : false;

        //Check skip rules
        if (
            lastSnap
            && getEpoch(cfg.resolution, lastSnap.ts) == getEpoch(cfg.resolution)
            && now - lastSnap.ts < cfg.resolution * 60 * 1000
        ) {
            if (GlobalData.verbose) log('Skipping perf collection due to resolution');
            return;
        }

        //Get performance data
        const sourceURL = (GlobalData.debugExternalSource) ? GlobalData.debugExternalSource : globals.fxRunner.fxServerHost;
        const currPerfRaw = await got(`http://${sourceURL}/perf/`).text();
        const currPerfData = parsePerf(currPerfRaw);
        if (
            !validatePerfThreadData(currPerfData.svSync)
            || !validatePerfThreadData(currPerfData.svNetwork)
            || !validatePerfThreadData(currPerfData.svMain)
        ) {
            throw new Error('invalid or incomplete /perf/ response');
        }

        //Process performance data
        const islinear = (
            lastSnap
            && now - lastSnap.ts <= cfg.resolution * 60 * 1000 * 4 //resolution time in ms * 4 -- just in case there is some lag
            && lastSnap.mainTickCounter < currPerfData.svMain.count
        );
        const currPerfDiff = diffPerfs(currPerfData, (islinear) ? lastSnap.perfSrc : false);
        Object.keys(currPerfDiff).forEach((thread) => {
            const bucketsFrequencies = [];
            currPerfDiff[thread].buckets.forEach((b, bIndex) => {
                const prevBucket = (bIndex) ? currPerfDiff[thread].buckets[bIndex - 1] : 0;
                const freq = (b - prevBucket) / currPerfDiff[thread].count;
                bucketsFrequencies.push(freq);
            });
            currPerfDiff[thread].buckets = bucketsFrequencies;
        });
        const currSnapshot = {
            ts: now,
            skipped: !islinear,
            mainTickCounter: currPerfData.svMain.count,
            clients: globals.playerController.getPlayerList().length,
            perfSrc: currPerfData,
            perf: currPerfDiff,
        };

        //Push to cache and save it
        this.perfSeries.push(currSnapshot);
        try {
            await fs.outputJSON(this.hardConfigs.heatmapDataFile, this.perfSeries);
            if (GlobalData.verbose) {
                logOk(`Collected performance snapshot #${this.perfSeries.length}`);
            }
        } catch (error) {
            if (GlobalData.verbose) {
                logWarn('Failed to write the performance history log file with error:');
                dir(error);
            }
        }
    }
}; //Fim StatsCollector()
