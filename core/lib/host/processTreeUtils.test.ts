import { suite, test, expect } from 'vitest';
import {
    calcCpuPercent,
    getProcessDescendants,
    getTreeParentPid,
    hasDumpServerArg,
    isExpectedProcReadError,
    parseLinuxProcStat,
    parseLinuxVmRss,
    parseWinProcTreeOutput,
} from './processTreeUtils';

const MAX_AGE = 5 * 60_000;


suite('calcCpuPercent', () => {
    const sample = (ts: number, cpuTime: number | null, startTime: number | null = 1000) => ({ ts, cpuTime, startTime });

    test('first load has no baseline', () => {
        expect(calcCpuPercent(undefined, sample(10_000, 500), MAX_AGE)).toBeNull();
    });

    test('uses cpu time delta over the actual elapsed time', () => {
        //250ms of cpu over 1s = 25%
        expect(calcCpuPercent(sample(0, 1000), sample(1000, 1250), MAX_AGE)).toBe(25);
        //same delta over 7.3s, not a fixed interval
        expect(calcCpuPercent(sample(0, 1000), sample(7300, 2825), MAX_AGE)).toBeCloseTo(25, 10);
    });

    test('keeps values above 100% (multicore)', () => {
        expect(calcCpuPercent(sample(0, 0), sample(2000, 6000), MAX_AGE)).toBe(300);
    });

    test('idle process is 0%', () => {
        expect(calcCpuPercent(sample(0, 500), sample(5000, 500), MAX_AGE)).toBe(0);
    });

    test('baseline older than the max age', () => {
        expect(calcCpuPercent(sample(0, 0), sample(MAX_AGE, 100), MAX_AGE)).toBe(100 / MAX_AGE * 100);
        expect(calcCpuPercent(sample(0, 0), sample(MAX_AGE + 1, 100), MAX_AGE)).toBeNull();
    });

    test('zero or negative elapsed time', () => {
        expect(calcCpuPercent(sample(1000, 0), sample(1000, 100), MAX_AGE)).toBeNull();
        expect(calcCpuPercent(sample(2000, 0), sample(1000, 100), MAX_AGE)).toBeNull();
    });

    test('cpu time went backwards (PID reused)', () => {
        expect(calcCpuPercent(sample(0, 5000), sample(1000, 100), MAX_AGE)).toBeNull();
    });

    test('start time changed (PID reused)', () => {
        expect(calcCpuPercent(sample(0, 100, 1000), sample(1000, 200, 2000), MAX_AGE)).toBeNull();
    });

    test('unknown start time falls back to the cpu time check', () => {
        expect(calcCpuPercent(sample(0, 100, null), sample(1000, 200, 2000), MAX_AGE)).toBe(10);
        expect(calcCpuPercent(sample(0, 100, 1000), sample(1000, 200, null), MAX_AGE)).toBe(10);
    });

    test('unknown or invalid cpu time', () => {
        expect(calcCpuPercent(sample(0, null), sample(1000, 200), MAX_AGE)).toBeNull();
        expect(calcCpuPercent(sample(0, 100), sample(1000, null), MAX_AGE)).toBeNull();
        expect(calcCpuPercent(sample(0, NaN), sample(1000, 200), MAX_AGE)).toBeNull();
        expect(calcCpuPercent(sample(NaN, 0), sample(1000, 200), MAX_AGE)).toBeNull();
    });
});


suite('getProcessDescendants', () => {
    const proc = (pid: number, ppid: number, startTime: number | null = 100) => ({ pid, ppid, startTime });

    test('returns root first, then descendants breadth-first', () => {
        const procs = [
            proc(1, 0, 1),
            proc(10, 1, 50),
            proc(20, 10, 150), //fxserver
            proc(21, 20, 160), //server dump helper
            proc(11, 10, 120), //monitor dump helper
            proc(30, 1, 200), //unrelated
        ];
        expect(getProcessDescendants(procs, 10).map((p) => p.pid)).toEqual([10, 20, 11, 21]);
    });

    test('root not found', () => {
        expect(getProcessDescendants([proc(1, 0)], 99)).toEqual([]);
    });

    test('skips children older than the parent (stale parent PID)', () => {
        const procs = [
            proc(10, 1, 500),
            proc(20, 10, 600),
            proc(30, 10, 100), //its real parent had PID 10 before txAdmin started
        ];
        expect(getProcessDescendants(procs, 10).map((p) => p.pid)).toEqual([10, 20]);
    });

    test('keeps children when start times are unknown', () => {
        const procs = [proc(10, 1, null), proc(20, 10, 5)];
        expect(getProcessDescendants(procs, 10).map((p) => p.pid)).toEqual([10, 20]);
    });

    test('does not loop on parent cycles', () => {
        const procs = [proc(10, 20, 100), proc(20, 10, 100)];
        expect(getProcessDescendants(procs, 10).map((p) => p.pid)).toEqual([10, 20]);
    });

    test('process listing itself as parent', () => {
        const procs = [proc(0, 0, null), proc(10, 0, 100)];
        expect(getProcessDescendants(procs, 0).map((p) => p.pid)).toEqual([0, 10]);
    });
});


suite('getTreeParentPid', () => {
    test('keeps the real parents', () => {
        const treePids = new Set([10, 20, 21]);
        expect(getTreeParentPid({ pid: 10, ppid: 1 }, 10, treePids)).toBe(1);
        expect(getTreeParentPid({ pid: 20, ppid: 10 }, 10, treePids)).toBe(10);
        expect(getTreeParentPid({ pid: 21, ppid: 20 }, 10, treePids)).toBe(20);
    });

    test('root parent PID reused by a descendant keeps the root at the top', () => {
        //txAdmin (10) was started by 20, which exited, and a txAdmin descendant reused PID 20
        const procs = [{ pid: 10, ppid: 20 }, { pid: 20, ppid: 10 }];
        const treePids = new Set(procs.map((p) => p.pid));
        const parents = procs.map((p) => getTreeParentPid(p, 10, treePids));
        expect(parents).toEqual([0, 10]);
        //same reconstruction the panel does: exactly one top-level node, the root
        const topLevel = procs.filter((p, i) => !treePids.has(parents[i]));
        expect(topLevel.map((p) => p.pid)).toEqual([10]);
    });

    test('only the root is rewritten', () => {
        expect(getTreeParentPid({ pid: 20, ppid: 30 }, 10, new Set([10, 20, 30]))).toBe(30);
    });
});


test('isExpectedProcReadError', () => {
    const fsError = (code: string) => Object.assign(new Error(code), { code });
    expect(isExpectedProcReadError(fsError('ENOENT'))).toBe(true);
    expect(isExpectedProcReadError(fsError('ESRCH'))).toBe(true);
    expect(isExpectedProcReadError(fsError('EACCES'))).toBe(true);
    expect(isExpectedProcReadError(fsError('EPERM'))).toBe(true);
    expect(isExpectedProcReadError(fsError('EMFILE'))).toBe(false);
    expect(isExpectedProcReadError(fsError('ENFILE'))).toBe(false);
    expect(isExpectedProcReadError(fsError('EIO'))).toBe(false);
    expect(isExpectedProcReadError(new Error('no code'))).toBe(false);
    expect(isExpectedProcReadError(undefined)).toBe(false);
    expect(isExpectedProcReadError(null)).toBe(false);
});


suite('parseLinuxProcStat', () => {
    const makeStat = (pid: number, comm: string, ppid: number, utime: number, stime: number, start: number) => {
        //fields 3..24: state, ppid, pgrp, session, tty, tpgid, flags, minflt, cminflt, majflt, cmajflt,
        //utime, stime, cutime, cstime, priority, nice, threads, itrealvalue, starttime, vsize, rss
        return `${pid} (${comm}) S ${ppid} 1 1 0 -1 4194560 100 0 0 0 ${utime} ${stime} 0 0 20 0 40 0 ${start} 1000000 2500 18446744073709551615\n`;
    };

    test('regular process', () => {
        expect(parseLinuxProcStat(makeStat(486, 'ld-musl-x86_64.', 1, 1234, 56, 98765))).toEqual({
            pid: 486,
            ppid: 1,
            comm: 'ld-musl-x86_64.',
            cpuTicks: 1290,
            startTime: 98765,
        });
    });

    test('comm with spaces and parentheses', () => {
        expect(parseLinuxProcStat(makeStat(7, 'weird) (name ) x', 3, 10, 5, 42))).toEqual({
            pid: 7,
            ppid: 3,
            comm: 'weird) (name ) x',
            cpuTicks: 15,
            startTime: 42,
        });
    });

    test('invalid content', () => {
        expect(parseLinuxProcStat('')).toBeUndefined();
        expect(parseLinuxProcStat('garbage')).toBeUndefined();
        expect(parseLinuxProcStat('x (y) S z')).toBeUndefined();
    });
});


test('parseLinuxVmRss', () => {
    expect(parseLinuxVmRss('Name:\tFXServer\nVmHWM:\t  999 kB\nVmRSS:\t  172836 kB\nRssAnon:\t 1 kB\n')).toBe(172836 * 1024);
    expect(parseLinuxVmRss('Name:\tkthreadd\nState:\tS (sleeping)\n')).toBeNull();
});


test('hasDumpServerArg', () => {
    expect(hasDumpServerArg(['FXServer.exe', '-dumpserver:416', '-parentpid:68388'])).toBe(true);
    expect(hasDumpServerArg(['cfx-server.exe', '-dumpserver', '31756'])).toBe(true);
    expect(hasDumpServerArg(['FXServer', '+set', 'citizen_dir', '/x/', '+exec', 'server.cfg'])).toBe(false);
    expect(hasDumpServerArg(['FXServer', '+set', 'sv_hostname', 'my-dumpserver-rp'])).toBe(false);
    expect(hasDumpServerArg([''])).toBe(false);
});


suite('parseWinProcTreeOutput', () => {
    test('regular output', () => {
        const stdout = [
            'ts=1792653886328',
            '68388|16772|328843264|51234|1792650000000|0|FXServer.exe',
            '25468|68388|125927424|90000|1792650001000|0|FXServer.exe',
            '61524|68388|6500352|15|1792650000500|1|FXServer.exe',
            '',
        ].join('\r\n');
        expect(parseWinProcTreeOutput(stdout)).toEqual({
            ts: 1792653886328,
            procs: [
                { pid: 68388, ppid: 16772, exeName: 'FXServer.exe', memory: 328843264, cpuTime: 51234, startTime: 1792650000000, isDumpServer: false },
                { pid: 25468, ppid: 68388, exeName: 'FXServer.exe', memory: 125927424, cpuTime: 90000, startTime: 1792650001000, isDumpServer: false },
                { pid: 61524, ppid: 68388, exeName: 'FXServer.exe', memory: 6500352, cpuTime: 15, startTime: 1792650000500, isDumpServer: true },
            ],
        });
    });

    test('unknown values', () => {
        const { procs } = parseWinProcTreeOutput('ts=1\n10|1|-1|-1|-1|?|\n');
        expect(procs).toEqual([{ pid: 10, ppid: 1, exeName: null, memory: null, cpuTime: null, startTime: null, isDumpServer: null }]);
    });

    test('ignores malformed lines and missing ts', () => {
        expect(parseWinProcTreeOutput('WARNING: something\n10|1|2|3\nabc|1|2|3|4|0|x.exe\n')).toEqual({ ts: null, procs: [] });
    });
});
