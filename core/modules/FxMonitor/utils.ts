/**
 * Class to easily check elapsed time.
 * Seconds precision, rounded down, consistent.
 */
export class Stopwatch {
    #tsStart: number | null = null;


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
