setInterval(() => {
    try {
        const megabyte = 1024 * 1024;
        const { heapUsed, heapTotal } = process.memoryUsage();
        PrintStructuredTrace(JSON.stringify({
            type: 'txAdminLogNodeHeap',
            used: parseFloat((heapUsed / megabyte).toFixed(2)),
            total: parseFloat((heapTotal / megabyte).toFixed(2)),
        }));
    } catch (error) {
        const msg = `Error reporting heap: ${error.message}`;
        console.log(`^5[txAdmin]^1${msg}^0`);
    }
}, 15_000);
