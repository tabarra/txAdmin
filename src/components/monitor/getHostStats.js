//Requires
const modulename = 'Monitor:HostStatus';
const os = require('os');
const si = require('systeminformation');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Const -hopefully
const giga = 1024 * 1024 * 1024;
const cpus = os.cpus();

module.exports = getHostStats = async () => {
    const out = {
        memory: {usage: 0, used: 0, total: 0},
        cpu: {
            count: cpus.length,
            speed: cpus[0].speed,
            usage: 0,
        },
    };

    //Getting memory usage
    try {
        let free, total, used;
        if (GlobalData.osType === 'linux') {
            const memoryData = await si.mem();
            free = memoryData.available / giga;
            total = memoryData.total / giga;
            used = memoryData.active / giga;
        } else {
            free = os.freemem() / giga;
            total = os.totalmem() / giga;
            used = total - free;
        }
        out.memory = {
            used,
            total,
            usage: Math.round((used / total) * 100),
        };
    } catch (error) {
        if (GlobalData.verbose) {
            logError('Failed to get memory usage.');
            dir(error);
        }
    }

    //Getting CPU usage
    try {
        const loads = await si.currentLoad();
        out.cpu.usage = Math.round(loads.currentLoad);
    } catch (error) {
        if (GlobalData.verbose) {
            logError('Failed to get CPU usage.');
            dir(error);
        }
    }

    return out;
};
