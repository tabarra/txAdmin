const v8 = require('node:v8');

/*
    Reports the server's Node.js heap and the whole FXServer process memory to txAdmin.
    process.memoryUsage.rss() asks the OS about the entire process (Windows working set,
    Linux /proc/self/stat rss), the same value wmic/pidusage used to read from outside,
    so txAdmin doesn't need to spawn anything to monitor the server memory.
    NOTE: txAdmin treats reports older than ~35s as stale, so keep the interval well below that.
*/
const REPORT_INTERVAL = 10_000;
const MB = 1024 * 1024;
const toMb = (bytes) => parseFloat((bytes / MB).toFixed(2));

const sendReport = () => {
    try {
        const { used_heap_size, heap_size_limit } = v8.getHeapStatistics();
        let rss;
        try {
            rss = toMb(process.memoryUsage.rss());
        } catch (error) { } //still report the heap

        PrintStructuredTrace(JSON.stringify({
            type: 'txAdminLogNodeHeap',
            ts: Date.now(),
            used: toMb(used_heap_size),
            limit: toMb(heap_size_limit),
            rss,
        }));
    } catch (error) {
        const msg = `Error reporting heap: ${error.message}`;
        console.log(`^5[txAdmin]^1${msg}^0`);
    }
};

sendReport();
setInterval(sendReport, REPORT_INTERVAL);
