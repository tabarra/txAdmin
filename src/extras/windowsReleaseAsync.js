/*
    NOTE: this is straight from @sindresorhus/windows-release, but with async functions.
            I have windows-release mostly just so I know when there are updates to it.
*/
const os = require('os');
const execa = require('execa');

// Reference: https://www.gaijin.at/en/lstwinver.php
const names = new Map([
    ['11.0', '11'],
    ['10.0', '10'],
    ['6.3', '8.1'],
    ['6.2', '8'],
    ['6.1', '7'],
    ['6.0', 'Vista'],
    ['5.2', 'Server 2003'],
    ['5.1', 'XP'],
    ['5.0', '2000'],
    ['4.9', 'ME'],
    ['4.1', '98'],
    ['4.0', '95'],
]);

const windowsReleaseAsync = async (release) => {
    const version = /\d+\.\d/.exec(release || os.release());

    if (release && !version) {
        throw new Error('`release` argument doesn\'t match `n.n`');
    }

    const ver = (version || [])[0];

    // Server 2008, 2012, 2016, 2019 and 2022 versions are ambiguous with desktop versions and must be detected at runtime.
    // If `release` is omitted or we're on a Windows system, and the version number is an ambiguous version
    // then use `wmic` to get the OS caption: https://msdn.microsoft.com/en-us/library/aa394531(v=vs.85).aspx
    // If `wmic` is obsolete (later versions of Windows 10), use PowerShell instead.
    // If the resulting caption contains the year 2008, 2012, 2016 or 2019, it is a server version, so return a server OS name.
    if ((!release || release === os.release()) && ['6.1', '6.2', '6.3', '10.0'].includes(ver)) {
        let stdout;
        try {
            const out = await execa('wmic', ['os', 'get', 'Caption']);
            stdout = out.stdout || '';
        } catch {
            const out = await execa('powershell', ['(Get-CimInstance -ClassName Win32_OperatingSystem).caption']);
            stdout = out.stdout || '';
        }

        if (stdout.includes('Windows 11')) {
            return '11';
        }

        const year = (stdout.match(/2008|2012|2016|2019|2022/) || [])[0];

        if (year) {
            return `Server ${year}`;
        }
    }

    return names.get(ver);
};

module.exports = windowsReleaseAsync;
