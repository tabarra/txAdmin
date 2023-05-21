const modulename = 'WebServer:ChartData';
import Cache from '../extras/dataCache';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

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
        const snapsPerHour = 60 / globals.performanceCollector.hardConfigs.performance.resolution;
        const maxDeltaTime = 30 * snapsPerHour; //30 hours
        const outData = globals.performanceCollector.perfSeries.slice(-maxDeltaTime).map((s) => {
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
    if (!Array.isArray(globals.performanceCollector.perfSeries)) {
        return ctx.send({ failReason: 'not_set' });
    }

    const snapsPerHour = 60 / globals.performanceCollector.hardConfigs.performance.resolution;
    if (globals.performanceCollector.perfSeries.length < snapsPerHour) {
        return ctx.send({ failReason: 'not_enough_data' });
    }

    //Process data & filter thread
    const availableThreads = ['svNetwork', 'svSync', 'svMain'];
    const threadName = (availableThreads.includes(ctx.params.thread)) ? ctx.params.thread : 'svMain';

    //Output
    return ctx.send(getChartData(threadName));
};
