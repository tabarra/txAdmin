/**
 * Force Quits the process with a small delay and padding for the console.
 */
export default function quitProcess(code = 0): never {
    //Process.exit will not quit if there are listeners on exit
    process.removeAllListeners('SIGHUP');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');

    //Hacky solution to guarantee the error is flushed 
    //before fxserver double prints the exit code
    process.stdout.write('\n');
    process.stdout.write('\n');

    //This will make the process hang for 100ms before exiting
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    process.exit(code);
}
