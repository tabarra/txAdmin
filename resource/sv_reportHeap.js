setInterval(() => {
    try {
        const { heapUsed, heapTotal } = process.memoryUsage();
        PrintStructuredTrace(JSON.stringify({
            type: 'txAdminLogNodeHeap',
            heapUsed,
            heapTotal,
        }));
    } catch (error) {
        const msg = `Error reporting heap: ${error.message}`;
        console.log(`^5[txAdmin]^1${msg}^0`);
    }
}, 15_000);
