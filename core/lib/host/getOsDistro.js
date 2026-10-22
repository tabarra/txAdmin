const modulename = 'getOsDistro';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);

/*
    NOTE: this is ported from @sindresorhus/windows-release.
    Local differences from upstream:
    - Uses async execa calls instead of sync child_process/powershell-utils calls.
    - Resolves reg.exe and powershell.exe through %SYSTEMROOT%/%WINDIR% when possible,
      since some hosts have broken PATH env vars.
    - Keeps the exported cached getOsDistro() wrapper around the Windows release detector.

    NOTE: I have windows-release dependency mostly just so I know when there are updates to it.
*/
import os from 'node:os';
import execa from 'execa';

// Reference: https://www.gaijin.at/en/lstwinver.php
// Windows 11 reference: https://docs.microsoft.com/en-us/windows/release-health/windows11-release-information
const names = new Map([
    ['10.0.2', '11'], // It's unclear whether future Windows 11 versions will use this version scheme: https://github.com/sindresorhus/windows-release/pull/26/files#r744945281
    ['10.0', '10'],
    ['6.3', '8.1'],
    ['6.2', '8'],
    ['6.1', '7'],
    ['6.0', 'Vista'],
    ['5.2', 'Server 2003'],
    ['5.1', 'XP'],
    ['5.0', '2000'],
    ['4.90', 'ME'],
    ['4.10', '98'],
    ['4.03', '95'],
    ['4.00', '95'],
]);

const ntCurrentVersionKey = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion';

//NOTE: custom code to resolve system binaries by absolute path, since some hosts
//have broken PATH env vars. If systemroot/windir is not defined, just try the
//bare binary name and hope for the best.
const getSystem32BinPath = (...binPath) => {
    const systemRoot = process.env?.SYSTEMROOT ?? process.env?.WINDIR ?? false;
    return systemRoot
        ? [systemRoot, 'System32', ...binPath].join('\\')
        : binPath[binPath.length - 1];
};

const queryNtCurrentVersion = async (valueName) => {
    try {
        const { stdout } = await execa(
            getSystem32BinPath('reg'),
            ['query', ntCurrentVersionKey, '/v', valueName],
        );
        return stdout || '';
    } catch {
        return '';
    }
};

// Server editions share version numbers with desktop editions (e.g., 10.0.26100 is both Windows 11 24H2 and Server 2025).
// The InstallationType registry value reliably identifies server installations.
// The CIM caption always reflects the correct server name, unlike the ProductName registry value
// which may report an older version on newer Windows Server editions.
const detectServerRelease = async () => {
    const installationType = await queryNtCurrentVersion('InstallationType');
    if (installationType && !installationType.includes('Server')) {
        return;
    }

    let caption;
    try {
        const psBinary = getSystem32BinPath('WindowsPowerShell', 'v1.0', 'powershell');
        const encodedCommand = Buffer.from(
            '(Get-CimInstance -ClassName Win32_OperatingSystem).caption',
            'utf16le',
        ).toString('base64');
        const out = await execa(psBinary, [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Bypass',
            '-EncodedCommand',
            encodedCommand,
        ]);
        caption = out.stdout;
    } catch { }

    // Less reliable fallback for restricted environments where PowerShell is unavailable.
    caption ||= await queryNtCurrentVersion('ProductName');

    const year = caption?.match(/Server\s+(\d{4})/)?.[1];
    if (year) {
        return `Server ${year}`;
    }
};

const windowsRelease = async (release) => {
    const versionMatch = /(\d+\.\d+)(?:\.(\d+))?/.exec(release || os.release());

    if (release && !versionMatch) {
        throw new Error('`release` argument doesn\'t match `n.n`');
    }

    let version = versionMatch[1] ?? '';
    const build = versionMatch[2] ?? '';

    if ((!release || release === os.release()) && ['6.1', '6.2', '6.3', '10.0'].includes(version)) {
        try {
            const serverRelease = await detectServerRelease();
            if (serverRelease) {
                return serverRelease;
            }
        } catch { }
    }

    // Windows 11 and Windows 10 build number validation for version 10.0
    if (version === '10.0' && build) {
        const buildNumber = Number.parseInt(build, 10);

        if (buildNumber >= 22_000 && buildNumber <= 30_000) {
            // Windows 11: build 22000 to 30000 (reasonable upper bound for future versions)
            version = '10.0.2';
        } else if (buildNumber >= 10_240 && buildNumber <= 19_045) {
            // Windows 10: build 10240 to 19045 - keep version as '10.0'
        } else {
            // Invalid build number - return undefined
            return undefined;
        }
    }

    return names.get(version);
};


/**
 * Cache calculated os distro
 */
let _osDistro;
export default async () => {
    if (_osDistro) return _osDistro;

    const osType = os.type();
    if (osType == 'Linux') {
        _osDistro = `${osType} ${os.release()}`;
    } else {
        try {
            const distro = await windowsRelease();
            _osDistro = distro ? `Windows ${distro}` : 'Windows Unknown';
        } catch (error) {
            console.warn(`Failed to detect windows version with error: ${error.message}`);
            _osDistro = `Windows Unknown`;
        }
    }
    return _osDistro;
};
