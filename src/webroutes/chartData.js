//Requires
const modulename = 'WebServer:ChartData';
const dateFormat = require('dateformat');
const xss = require('../extras/xss')();
const { dir, log, logOk, logWarn, logError, getLog } = require('../extras/console')(modulename);


/**
 * Returns the output page containing the action log, and the console log
 * @param {object} ctx
 */
module.exports = async function chartData(ctx) {
    if(!Array.isArray(globals.statsCollector.perfSeries)){
        return ctx.send({failReason: 'not_set'});
    }
    if(globals.statsCollector.perfSeries.length < 12){
        return ctx.send({failReason: 'not_enough_data'});
    }
    
    //Process data & filter thread
    // const threadName = 'svNetwork';
    // const threadName = 'svSync';
    const threadName = 'svMain';
    const maxDeltaTime = 288; //5*288 = 1440 = 1 day
    let outData;
    try {
        outData = globals.statsCollector.perfSeries.slice(-maxDeltaTime).map(s => {
            return {
                ts: s.ts,
                clients: s.clients,
                avgTime: s.perf[threadName].sum / s.perf[threadName].count,
                buckets: s.perf[threadName].buckets,
            }
        });
    } catch (error) {
        outData = {failReason: 'data_processing'}
    }

    //Output
    return ctx.send(outData);
};
