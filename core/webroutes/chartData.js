const modulename = 'WebServer:ChartData';
import Cache from '../extras/dataCache';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

const caches = {
    svNetwork: new Cache(30),
    svSync: new Cache(30),
    svMain: new Cache(30),
};

export const getChartData = (threadName) => {
    //If cache available
    const cachedData = caches[threadName].get();
    if (cachedData !== false) {
        return cachedData;
    }

    //Process log
    try {
        //every hour = 12 records
        const maxDeltaTime = 360; //30*12
        const outData = globals.statsCollector.perfSeries.slice(-maxDeltaTime).map((s) => {
            return {
                ts: s.ts,
                skipped: s.skipped,
                clients: s.clients,
                avgTime: s.perf[threadName].sum / s.perf[threadName].count,
                buckets: s.perf[threadName].buckets,
            };
        });
        caches[threadName].set(outData);
        return outData;
    } catch (error) {
        return { failReason: 'data_processing' };
    }
};


/**
 * Returns the output page containing the action log, and the console log
 * @param {object} ctx
 */
export default async function chartData(ctx) {
    if (!Array.isArray(globals.statsCollector.perfSeries)) {
        return ctx.send({ failReason: 'not_set' });
    }
    if (globals.statsCollector.perfSeries.length < 12) {
        return ctx.send({ failReason: 'not_enough_data' });
    }

    //Process data & filter thread
    const availableThreads = ['svNetwork', 'svSync', 'svMain'];
    const threadName = (availableThreads.includes(ctx.params.thread)) ? ctx.params.thread : 'svMain';

    //Output
    return ctx.send(getChartData(threadName));
};
