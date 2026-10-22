import fsp from 'node:fs/promises';
import { execFile } from 'node:child_process';
import {
    getProcessDescendants,
    hasDumpServerArg,
    isExpectedProcReadError,
    parseLinuxProcStat,
    parseLinuxVmRss,
    parseWinProcTreeOutput,
    type OsProcInfo,
} from './processTreeUtils';

/*
    Lists a process and all its descendants straight from the OS, without wmic or ps.
    Used only on demand by the diagnostics page/report (never on a timer), as on Windows
    each call spawns one PowerShell process (~0.5s).

    NOTE: Command lines are only used to detect the crash-dump helpers, and are never
    returned or logged, as the server one contains tokens and possibly user secrets.
*/

const WIN_QUERY_TIMEOUT_MS = 10_000;
const LINUX_USER_HZ = 100; //clock ticks per second in /proc, fixed for userspace on Linux
const LINUX_READ_CONCURRENCY = 32; //max /proc files open at once

export type ProcessTreeSnapshot = {
    ts: number;
    procs: OsProcInfo[]; //root first
};


/**
 * Same PowerShell path handling as getOsDistro, with an explicit extension
 * If systemroot/windir is not defined, just try "powershell" and hope for the best
 */
const getPowerShellPath = () => {
    const systemRoot = process.env?.SYSTEMROOT ?? process.env?.WINDIR ?? false;
    return systemRoot
        ? `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
        : 'powershell.exe';
};


/**
 * PowerShell script that lists the root and its descendants in one narrow CIM query.
 * Only descendants get their command line read, and only a dump-helper flag leaves the script.
 * This PowerShell process (a child of the root) is excluded, along with its conhost.
 * NOTE: $PID is the automatic variable with this PowerShell's own process id, hence $procId.
 */
const getWinScript = (rootPid: number) => `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
trap { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
$rootPid = [uint32]${rootPid}
$selfId = [uint32]$PID
$epoch = [DateTime]'1970-01-01'
$all = @(Get-CimInstance -ClassName Win32_Process -Property ProcessId,ParentProcessId,Name,WorkingSetSize,KernelModeTime,UserModeTime,CreationDate)
$ts = [long](([DateTime]::UtcNow - $epoch).TotalMilliseconds)
function Get-CreatedMs($p) {
    if ($null -eq $p.CreationDate) { return [long]-1 }
    return [long](($p.CreationDate.ToUniversalTime() - $epoch).TotalMilliseconds)
}
$byPid = @{}
$childrenOf = @{}
foreach ($p in $all) {
    $byPid[[uint32]$p.ProcessId] = $p
    $ppid = [uint32]$p.ParentProcessId
    if (-not $childrenOf.ContainsKey($ppid)) { $childrenOf[$ppid] = New-Object System.Collections.Generic.List[object] }
    $childrenOf[$ppid].Add($p)
}
if (-not $byPid.ContainsKey($rootPid)) { throw "root process not found" }

$tree = New-Object System.Collections.Generic.List[object]
$seen = @{ $rootPid = $true }
$queue = New-Object System.Collections.Generic.Queue[object]
$queue.Enqueue($byPid[$rootPid])
while ($queue.Count -gt 0) {
    $parent = $queue.Dequeue()
    $tree.Add($parent)
    $parentId = [uint32]$parent.ProcessId
    if (-not $childrenOf.ContainsKey($parentId)) { continue }
    $parentCreated = Get-CreatedMs $parent
    foreach ($child in $childrenOf[$parentId]) {
        $childId = [uint32]$child.ProcessId
        if ($childId -eq $selfId -or $seen.ContainsKey($childId)) { continue }
        $childCreated = Get-CreatedMs $child
        if ($parentCreated -ge 0 -and $childCreated -ge 0 -and $childCreated -lt $parentCreated) { continue }
        $seen[$childId] = $true
        $queue.Enqueue($child)
    }
}

$dumpIds = @{}
$dumpUnknown = $false
$descIds = @($tree | ForEach-Object { [uint32]$_.ProcessId } | Where-Object { $_ -ne $rootPid })
if ($descIds.Count -gt 0) {
    try {
        $filter = ($descIds | ForEach-Object { "ProcessId=$_" }) -join ' OR '
        foreach ($c in @(Get-CimInstance -ClassName Win32_Process -Filter $filter -Property ProcessId,CommandLine)) {
            if ($c.CommandLine -match '(^|\\s)-dumpserver') { $dumpIds[[uint32]$c.ProcessId] = $true }
        }
    } catch {
        $dumpUnknown = $true
    }
}

"ts=$ts"
foreach ($p in $tree) {
    $procId = [uint32]$p.ProcessId
    $mem = if ($null -eq $p.WorkingSetSize) { -1 } else { [uint64]$p.WorkingSetSize }
    $cpu = if ($null -eq $p.KernelModeTime -and $null -eq $p.UserModeTime) { -1 } else { [long](([uint64]$p.KernelModeTime + [uint64]$p.UserModeTime) / 10000) }
    $dump = if ($procId -eq $rootPid) { '0' } elseif ($dumpUnknown) { '?' } elseif ($dumpIds.ContainsKey($procId)) { '1' } else { '0' }
    "$procId|$([uint32]$p.ParentProcessId)|$mem|$cpu|$(Get-CreatedMs $p)|$dump|$($p.Name)"
}
`;


/**
 * Windows: one PowerShell process, with a timeout
 */
const getWindowsSnapshot = (rootPid: number) => new Promise<ProcessTreeSnapshot>((resolve, reject) => {
    const encodedScript = Buffer.from(getWinScript(rootPid), 'utf16le').toString('base64');
    const args = ['-NoProfile', '-NonInteractive', '-NoLogo', '-OutputFormat', 'Text', '-EncodedCommand', encodedScript];
    const child = execFile(getPowerShellPath(), args, {
        windowsHide: true,
        timeout: WIN_QUERY_TIMEOUT_MS,
        killSignal: 'SIGKILL',
        maxBuffer: 1024 * 1024,
    }, (error, stdout, stderr) => {
        if (error) {
            //NOTE: not using error.message, as it contains the whole (encoded) command
            let reason: string;
            if (error.killed) {
                reason = `timed out after ${WIN_QUERY_TIMEOUT_MS}ms`;
            } else if (typeof error.code === 'string') {
                reason = error.code; //spawn error, eg ENOENT
            } else {
                const stderrLine = String(stderr).split(/\r?\n/).find((line) => line.trim())?.trim().slice(0, 200);
                reason = `exit code ${error.code}${stderrLine ? `: ${stderrLine}` : ''}`;
            }
            return reject(new Error(`PowerShell process query failed: ${reason}`));
        }
        const { ts, procs } = parseWinProcTreeOutput(stdout);
        if (!procs.length || procs[0].pid !== rootPid) {
            return reject(new Error('PowerShell process query returned no data for the root process.'));
        }
        resolve({ ts: ts ?? Date.now(), procs });
    });
    //Make sure PowerShell never waits on stdin
    child.stdin?.end();
});


/**
 * Like Promise.all(items.map(fn)), but with at most `limit` calls running at once.
 */
const mapWithConcurrency = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) => {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;
    const worker = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            results[index] = await fn(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
};


/**
 * Reads a /proc file, returning undefined if the process exited or is not readable.
 * Other errors (eg EMFILE) are thrown, so a broken scan is never shown as a complete tree.
 */
const readProcFile = async (filePath: string) => {
    try {
        return await fsp.readFile(filePath, 'utf8');
    } catch (error) {
        if (isExpectedProcReadError(error)) return undefined;
        throw error;
    }
};


/**
 * Linux: reads /proc directly (no ps/procps needed)
 */
const getLinuxSnapshot = async (rootPid: number): Promise<ProcessTreeSnapshot> => {
    const entries = await fsp.readdir('/proc');
    const pids = entries.filter((entry) => /^\d+$/.test(entry));
    const stats = await mapWithConcurrency(pids, LINUX_READ_CONCURRENCY, async (pid) => {
        const content = await readProcFile(`/proc/${pid}/stat`);
        return content !== undefined ? parseLinuxProcStat(content) : undefined;
    });
    const ts = Date.now();
    const validStats = stats.filter((stat): stat is NonNullable<typeof stat> => stat !== undefined);
    const tree = getProcessDescendants(validStats, rootPid);
    if (!tree.length) throw new Error('Root process not found in /proc.');

    const procs = await mapWithConcurrency(tree, LINUX_READ_CONCURRENCY, async (stat): Promise<OsProcInfo> => {
        const status = await readProcFile(`/proc/${stat.pid}/status`);
        const memory = status !== undefined ? parseLinuxVmRss(status) : null;

        let isDumpServer: boolean | null = false;
        if (stat.pid !== rootPid) {
            const cmdline = await readProcFile(`/proc/${stat.pid}/cmdline`);
            isDumpServer = cmdline !== undefined ? hasDumpServerArg(cmdline.split('\0')) : null;
        }

        return {
            pid: stat.pid,
            ppid: stat.ppid,
            exeName: stat.comm,
            memory,
            cpuTime: stat.cpuTicks !== null ? (stat.cpuTicks * 1000) / LINUX_USER_HZ : null,
            startTime: stat.startTime,
            isDumpServer,
        };
    });
    return { ts, procs };
};


/**
 * Returns the root process (first) and all its descendants, read from the OS.
 * Throws if the OS query fails or the platform is not supported.
 */
export default async function getProcessTree(rootPid: number): Promise<ProcessTreeSnapshot> {
    if (process.platform === 'win32') {
        return getWindowsSnapshot(rootPid);
    } else if (process.platform === 'linux') {
        return getLinuxSnapshot(rootPid);
    } else {
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
}
