const v8 = require('node:v8');

setInterval(() => {
    try {
        const megabyte = 1024 * 1024;
        const { used_heap_size, heap_size_limit } = v8.getHeapStatistics();
        PrintStructuredTrace(JSON.stringify({
            type: 'txAdminLogNodeHeap',
            used: parseFloat((used_heap_size / megabyte).toFixed(2)),
            limit: parseFloat((heap_size_limit / megabyte).toFixed(2)),
        }));
    } catch (error) {
        const msg = `Error reporting heap: ${error.message}`;
        console.log(`^5[txAdmin]^1${msg}^0`);
    }
}, 15_000);
