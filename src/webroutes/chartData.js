//Requires
const modulename = 'WebServer:ChartData';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);
const Cache = require('../extras/dataCache');

const caches = {
    svNetwork: new Cache(30),
    svSync: new Cache(30),
    svMain: new Cache(30),
};


/**
 * Returns the output page containing the action log, and the console log
 * @param {object} ctx
 */
module.exports = async function chartData(ctx) {
    if (!Array.isArray(globals.statsCollector.perfSeries)) {
        return ctx.send({failReason: 'not_set'});
    }
    if (globals.statsCollector.perfSeries.length < 12) {
        return ctx.send({failReason: 'not_enough_data'});
    }

    //Process data & filter thread
    const availableThreads = ['svNetwork', 'svSync', 'svMain'];
    const threadName = (availableThreads.includes(ctx.params.thread)) ? ctx.params.thread : 'svMain';

    //If cache available
    const cachedData = caches[threadName].get();
    if (cachedData !== false) {
        return ctx.send(cachedData);
    }

    //Process log
    let outData;
    try {
        // const maxDeltaTime = 288; //5*288 = 1440 = 1 day
        const maxDeltaTime = 360; //5*360 = 30 hours
        outData = globals.statsCollector.perfSeries.slice(-maxDeltaTime).map((s) => {
            return {
                ts: s.ts,
                skipped: s.skipped,
                clients: s.clients,
                avgTime: s.perf[threadName].sum / s.perf[threadName].count,
                buckets: s.perf[threadName].buckets,
            };
        });
    } catch (error) {
        outData = {failReason: 'data_processing'};
    }

    //Output
    caches[threadName].set(outData);
    return ctx.send(outData);
};
