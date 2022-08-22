const fs = require('node:fs');
const path = require('node:path');


/**
 * txAdmin in ASCII
 * @returns {String}
 */
const txAdminASCII = () => {
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
}


/**
 * txAdmin + license banner for bundled files
 * @returns {String}
 */
const licenseBanner = () => {
    const licensePath = path.join('.', 'LICENSE');
    const lineSep = '%'.repeat(80);
    const logoPad = ' '.repeat(18);
    const contentLines = [
        '',
        lineSep,
        ...txAdminASCII().split('\n').map(x => logoPad + x),
        lineSep,
        `Author: André Tabarra (https://github.com/tabarra)`,
        `Repository: https://github.com/tabarra/txAdmin`,
        `txAdmin is a free open source software provided under the license below.`,
        lineSep,
        ...fs.readFileSync(licensePath, 'utf8').trim().split('\n'),
        lineSep,
    ].join(`\n * `);
    return `/*!${contentLines}\n */`;
}


module.exports = {
    txAdminASCII,
    licenseBanner,
}
