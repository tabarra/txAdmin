/**
 * One process from an OS snapshot (null means unknown)
 */
export type OsProcInfo = {
    pid: number;
    ppid: number;
    exeName: string | null; //exe name on windows, comm on linux
    memory: number | null; //working set (windows) or rss (linux), in bytes
    cpuTime: number | null; //user + kernel, in ms
    startTime: number | null; //os-specific unit, only used for comparisons
    isDumpServer: boolean | null; //has the -dumpserver arg
};

export type CpuSample = {
    ts: number;
    cpuTime: number | null;
    startTime: number | null;
};


/**
 * Calculates the CPU usage between two samples, as % of one core (can go above 100%).
 * Returns null if there is no valid baseline (first load, too old, PID reused, etc).
 */
export const calcCpuPercent = (
    prev: CpuSample | undefined,
    curr: CpuSample,
    maxBaselineAgeMs: number,
): number | null => {
    if (!prev) return null;
    if (prev.cpuTime === null || curr.cpuTime === null) return null;
    if (!Number.isFinite(prev.cpuTime) || !Number.isFinite(curr.cpuTime)) return null;
    if (prev.startTime !== null && curr.startTime !== null && prev.startTime !== curr.startTime) return null;

    const elapsedMs = curr.ts - prev.ts;
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || elapsedMs > maxBaselineAgeMs) return null;

    const cpuDeltaMs = curr.cpuTime - prev.cpuTime;
    if (cpuDeltaMs < 0) return null;
    return (cpuDeltaMs / elapsedMs) * 100;
};


/**
 * Returns the root process followed by all its descendants, or an empty array if not found.
 * NOTE: children older than their parent are skipped, as that means the parent PID was reused.
 */
export const getProcessDescendants = <T extends Pick<OsProcInfo, 'pid' | 'ppid' | 'startTime'>>(
    procs: T[],
    rootPid: number,
): T[] => {
    const byPid = new Map<number, T>();
    const childrenOf = new Map<number, T[]>();
    for (const proc of procs) {
        byPid.set(proc.pid, proc);
        const siblings = childrenOf.get(proc.ppid);
        if (siblings) {
            siblings.push(proc);
        } else {
            childrenOf.set(proc.ppid, [proc]);
        }
    }

    const root = byPid.get(rootPid);
    if (!root) return [];
    const result: T[] = [];
    const seen = new Set<number>([rootPid]);
    const queue: T[] = [root];
    while (queue.length) {
        const parent = queue.shift()!;
        result.push(parent);
        for (const child of childrenOf.get(parent.pid) ?? []) {
            if (seen.has(child.pid)) continue;
            if (
                parent.startTime !== null
                && child.startTime !== null
                && child.startTime < parent.startTime
            ) continue;
            seen.add(child.pid);
            queue.push(child);
        }
    }
    return result;
};


/**
 * Returns the parent PID to report for a process in the tree.
 * NOTE: on windows the root's parent PID can be reused by a descendant, making the tree circular.
 */
export const getTreeParentPid = (
    proc: Pick<OsProcInfo, 'pid' | 'ppid'>,
    rootPid: number,
    treePids: Set<number>,
) => {
    if (proc.pid === rootPid && treePids.has(proc.ppid)) return 0;
    return proc.ppid;
};


/**
 * Checks if a /proc read failed because the process exited or is not readable.
 * Anything else (eg EMFILE) means the scan itself is broken.
 */
const EXPECTED_PROC_READ_ERRORS = new Set(['ENOENT', 'ESRCH', 'EACCES', 'EPERM']);
export const isExpectedProcReadError = (error: unknown) => {
    const code = (error as { code?: unknown } | null | undefined)?.code;
    return typeof code === 'string' && EXPECTED_PROC_READ_ERRORS.has(code);
};


/**
 * Parses the content of /proc/<pid>/stat, cpu and start times are in clock ticks.
 * NOTE: comm can contain spaces and parentheses, so the fields are split after the last ')'
 */
export const parseLinuxProcStat = (content: string) => {
    const pidEnd = content.indexOf(' (');
    const commEnd = content.lastIndexOf(')');
    if (pidEnd <= 0 || commEnd <= pidEnd) return;
    const pid = parseInt(content.slice(0, pidEnd), 10);
    const comm = content.slice(pidEnd + 2, commEnd);
    //Fields after comm, starting at field 3 (state)
    const fields = content.slice(commEnd + 2).trim().split(/\s+/);
    const ppid = parseInt(fields[1], 10); //field 4
    const utime = parseInt(fields[11], 10); //field 14
    const stime = parseInt(fields[12], 10); //field 15
    const startTime = parseInt(fields[19], 10); //field 22
    if (!Number.isInteger(pid) || !Number.isInteger(ppid)) return;
    return {
        pid,
        ppid,
        comm: comm || null,
        cpuTicks: Number.isFinite(utime) && Number.isFinite(stime) ? utime + stime : null,
        startTime: Number.isFinite(startTime) ? startTime : null,
    };
};


/**
 * Parses the VmRSS line of /proc/<pid>/status, returns bytes.
 */
export const parseLinuxVmRss = (content: string) => {
    const match = /^VmRSS:\s+(\d+)\s+kB/m.exec(content);
    if (!match) return null;
    return parseInt(match[1], 10) * 1024;
};


/**
 * Checks if the args belong to an FXServer crash-dump helper.
 * Legacy: `-dumpserver:416 -parentpid:123`, Enhanced: `-dumpserver 123`
 */
export const hasDumpServerArg = (args: string[]) => {
    return args.some((arg) => arg.startsWith('-dumpserver'));
};


/**
 * Parses the output of the windows PowerShell process tree script.
 * Format: `ts=<unix ms>` then `pid|ppid|workingSet|cpuMs|createdMs|isDump|exeName` per process,
 * where -1 means unknown and isDump is 1, 0 or ?
 */
export const parseWinProcTreeOutput = (stdout: string) => {
    const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const tsLine = lines.find((line) => line.startsWith('ts='));
    const ts = tsLine ? parseInt(tsLine.slice(3), 10) : NaN;
    const toNullable = (value: string) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? num : null;
    };

    const procs: OsProcInfo[] = [];
    for (const line of lines) {
        if (line.startsWith('ts=')) continue;
        const parts = line.split('|');
        if (parts.length < 7) continue;
        const pid = parseInt(parts[0], 10);
        const ppid = parseInt(parts[1], 10);
        if (!Number.isInteger(pid) || !Number.isInteger(ppid)) continue;
        const exeName = parts.slice(6).join('|').trim();
        procs.push({
            pid,
            ppid,
            exeName: exeName || null,
            memory: toNullable(parts[2]),
            cpuTime: toNullable(parts[3]),
            startTime: toNullable(parts[4]),
            isDumpServer: parts[5] === '1' ? true : parts[5] === '0' ? false : null,
        });
    }
    return {
        ts: Number.isFinite(ts) ? ts : null,
        procs,
    };
};
