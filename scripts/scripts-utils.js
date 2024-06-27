import fs from 'node:fs';
import path from 'node:path';


/**
 * txAdmin in ASCII
 * @returns {String}
 */
export const txAdminASCII = () => {
    //NOTE: precalculating the ascii art for efficiency
    // const figlet = require('figlet');
    // let ascii = figlet.textSync('txAdmin');
    // let b64 = Buffer.from(ascii).toString('base64');
    // console.log(b64);
    const preCalculated = `ICBfICAgICAgICAgICAgXyAgICAgICBfICAgICAgICAgICBfICAgICAgIAogfCB8X19fICBfX
 yAgIC8gXCAgIF9ffCB8XyBfXyBfX18gKF8pXyBfXyAgCiB8IF9fXCBcLyAvICAvIF8gXCAvIF9gIHwgJ18gYCBfIFx8IHwg
 J18gXCAKIHwgfF8gPiAgPCAgLyBfX18gXCAoX3wgfCB8IHwgfCB8IHwgfCB8IHwgfAogIFxfXy9fL1xfXC9fLyAgIFxfXF9
 fLF98X3wgfF98IHxffF98X3wgfF98CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=`;
    return Buffer.from(preCalculated, 'base64').toString('ascii');
};


/**
 * txAdmin + license banner for bundled files
 * @returns {String}
 */
export const licenseBanner = (baseDir = '.', isBundledFile = false) => {
    const licensePath = path.join(baseDir, 'LICENSE');
    const rootPrefix = isBundledFile ? '../' : '';
    const lineSep = '%'.repeat(80);
    const logoPad = ' '.repeat(18);
    const contentLines = [
        lineSep,
        ...txAdminASCII().split('\n').map((x) => logoPad + x),
        lineSep,
        'Author: André Tabarra (https://github.com/tabarra)',
        'Repository: https://github.com/tabarra/txAdmin',
        'txAdmin is a free open source software provided under the license below.',
        lineSep,
        ...fs.readFileSync(licensePath, 'utf8').trim().split('\n'),
        lineSep,
        'This distribution also includes third party code under their own licenses, which',
        `can be found in ${rootPrefix}THIRD-PARTY-LICENSES.txt or their respective repositories.`,
        `Attribution for non-code assets can be found at the bottom of ${rootPrefix}README.md or at`,
        'the top of the respective file.',
        lineSep,
    ];
    if (isBundledFile) {
        const flattened = contentLines.join('\n * ');
        return `/*!\n * ${flattened}\n */`;
    } else {
        return contentLines.join('\n');
    }
};



/**
 * Processes a fxserver path to validate it as well as the monitor folder.
 * NOTE: this function is windows only, but could be easily adapted.
 * @param {String} fxserverPath
 * @returns fxServerRootPath, fxsBinPath, monitorPath
 */
export const getFxsPaths = (fxserverPath) => {
    const fxServerRootPath = path.normalize(fxserverPath);

    //Process fxserver path
    const fxsBinPath = path.join(fxServerRootPath, 'FXServer.exe');
    const fxsBinPathStat = fs.statSync(fxsBinPath);
    if (!fxsBinPathStat.isFile()) {
        throw new Error(`${fxsBinPath} is not a file.`);
    }

    //Process monitor path
    const monitorPath = path.join(fxServerRootPath, 'citizen', 'system_resources', 'monitor');
    const monitorPathStat = fs.statSync(monitorPath);
    if (!monitorPathStat.isDirectory()) {
        throw new Error(`${monitorPath} is not a directory.`);
    }

    return { fxServerRootPath, fxsBinPath, monitorPath };
};
