const modulename = 'Monitor:HostStatus';
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
 */
export const getHostStats = async () => {
    const out = {
        memory: { usage: 0, used: 0, total: 0 },
        cpu: {
            count: cpus.length,
            speed: cpus[0].speed,
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


/**
 * Class to easily check elapsed time.
 * Seconds precision, rounded down, consistent.
 */
export class Stopwatch {
    #tsStart: number | null = null;

    constructor() { }

    /**
     * Reset the stopwatch (stop and clear).
     */
    reset() {
        this.#tsStart = null;
    }

    /**
     * Start or restart the stopwatch.
     */
    restart() {
        this.#tsStart = Date.now();
    }

    /**
     * Returns if the timer is over a certain amount of time.
     * Always false if not started.
     */
    isOver(secs: number) {
        const elapsed = this.elapsed;
        if (elapsed === Infinity) {
            return false;
        } else {
            return elapsed >= secs;
        }
    }

    /**
     * Returns true if the stopwatch is running.
     */
    get started() {
        return this.#tsStart !== null;
    }

    /**
     * Returns the elapsed time in seconds or Infinity if not started.
     */
    get elapsed() {
        if (this.#tsStart === null) {
            return Infinity;
        } else {
            const elapsedMs = Date.now() - this.#tsStart;
            return Math.floor(elapsedMs / 1000);
        }
    }
}
