const modulename = 'getOsDistro';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);

/*
    NOTE: this is straight from @sindresorhus/windows-release, but with async functions.
    I have windows-release dependency mostly just so I know when there are updates to it.
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

async function windowsRelease(release) {
    const version = /(\d+\.\d+)(?:\.(\d+))?/.exec(release || os.release());

    if (release && !version) {
        throw new Error('`release` argument doesn\'t match `n.n`');
    }

    let ver = version[1] || '';
    const build = version[2] || '';

    // Server 2008, 2012, 2016, and 2019 versions are ambiguous with desktop versions and must be detected at runtime.
    // If `release` is omitted or we're on a Windows system, and the version number is an ambiguous version
    // then use `wmic` to get the OS caption: https://msdn.microsoft.com/en-us/library/aa394531(v=vs.85).aspx
    // If `wmic` is obsolete (later versions of Windows 10), use PowerShell instead.
    // If the resulting caption contains the year 2008, 2012, 2016, 2019 or 2022, it is a server version, so return a server OS name.
    if ((!release || release === os.release()) && ['6.1', '6.2', '6.3', '10.0'].includes(ver)) {
        let stdout;
        try {
            const out = await execa('wmic', ['os', 'get', 'Caption']);
            stdout = out.stdout || '';
        } catch {
            //NOTE: custom code to select the powershell path
            //if systemroot/windir is not defined, just try "powershell" and hope for the best
            const systemRoot = process.env?.SYSTEMROOT ?? process.env?.WINDIR ?? false;
            const psBinary = systemRoot
                ? `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell`
                : 'powershell';
            const out = await execa(psBinary, ['(Get-CimInstance -ClassName Win32_OperatingSystem).caption']);
            stdout = out.stdout || '';
        }

        const year = (stdout.match(/2008|2012|2016|2019|2022/) || [])[0];

        if (year) {
            return `Server ${year}`;
        }
    }

    // Windows 11
    if (ver === '10.0' && build.startsWith('2')) {
        ver = '10.0.2';
    }

    return names.get(ver);
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
            _osDistro = `Windows ${distro}`;
        } catch (error) {
            console.warn(`Failed to detect windows version with error: ${error.message}`);
            _osDistro = `Windows Unknown`;
        }
    }
    return _osDistro;
};
