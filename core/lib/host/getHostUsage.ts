const modulename = 'GetHostUsage';
import os from 'node:os';
import si from 'systeminformation';
import { txEnv } from '@core/globalData';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);

//Const -hopefully
const giga = 1024 * 1024 * 1024;
const cpus = os.cpus();


/**
 * Get the host's current memory and CPU usage.
 * NOTE: It was used by the hw stats on the sidebar
 *   Currently only in use by diagnostics page
 */
export default async () => {
    const out = {
        memory: { usage: 0, used: 0, total: 0 },
        cpu: {
            count: cpus.length,
            usage: 0,
        },
    };

    //Getting memory usage
    try {
        let free, total, used;
        if (txEnv.isWindows) {
            free = os.freemem() / giga;
            total = os.totalmem() / giga;
            used = total - free;
        } else {
            const memoryData = await si.mem();
            free = memoryData.available / giga;
            total = memoryData.total / giga;
            used = memoryData.active / giga;
        }
        out.memory = {
            used,
            total,
            usage: Math.round((used / total) * 100),
        };
    } catch (error) {
        console.verbose.error('Failed to get memory usage.');
        console.verbose.dir(error);
    }

    //Getting CPU usage
    try {
        const loads = await si.currentLoad();
        out.cpu.usage = Math.round(loads.currentLoad);
    } catch (error) {
        console.verbose.error('Failed to get CPU usage.');
        console.verbose.dir(error);
    }

    return out;
};
