const v8 = require('node:v8');

const megabyte = 1024 * 1024;
let lastReportTime = 0;
let lastHeapSize = 0;
setInterval(() => {
    try {
        const now = Date.now();
        const { used_heap_size, heap_size_limit } = v8.getHeapStatistics();
        const diffPct = Math.abs(used_heap_size - lastHeapSize) / lastHeapSize;
        if (now - lastReportTime >= 30_000 || diffPct >= 0.1) {
            lastReportTime = Date.now();
            PrintStructuredTrace(JSON.stringify({
                type: 'txAdminLogNodeHeap',
                used: parseFloat((used_heap_size / megabyte).toFixed(2)),
                limit: parseFloat((heap_size_limit / megabyte).toFixed(2)),
            }));
        }
    } catch (error) {
        const msg = `Error reporting heap: ${error.message}`;
        console.log(`^5[txAdmin]^1${msg}^0`);
    }
}, 5_000);
