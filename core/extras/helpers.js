/**
 * txAdmin in ASCII
 */
let __ascii;
export const txAdminASCII = () => {
    //NOTE: precalculating the ascii art for efficiency
    // import figlet from 'figlet';
    // let ascii = figlet.textSync('txAdmin');
    // let b64 = Buffer.from(ascii).toString('base64');
    // console.log(b64);
    if (!__ascii) {
        const preCalculated = `ICBfICAgICAgICAgICAgXyAgICAgICBfICAgICAgICAgICBfICAgICAgIAogfCB8X19fICBfX
    yAgIC8gXCAgIF9ffCB8XyBfXyBfX18gKF8pXyBfXyAgCiB8IF9fXCBcLyAvICAvIF8gXCAvIF9gIHwgJ18gYCBfIFx8IHwg
    J18gXCAKIHwgfF8gPiAgPCAgLyBfX18gXCAoX3wgfCB8IHwgfCB8IHwgfCB8IHwgfAogIFxfXy9fL1xfXC9fLyAgIFxfXF9
    fLF98X3wgfF98IHxffF98X3wgfF98CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=`;
        __ascii = Buffer.from(preCalculated, 'base64').toString('ascii');
    }
    return __ascii;
}


/**
 * Extracts hours and minutes from an string containing times
 * @param {Array} scheduleTimes
 * @param {Boolean} filter default true
 * @return {Object} {valid, invalid}
 */
export const parseSchedule = (scheduleTimes) => {
    const valid = [];
    const invalid = [];
    for (const timeInput of scheduleTimes) {
        if (typeof timeInput !== 'string') continue;
        const timeTrim = timeInput.trim();
        if (!timeTrim.length) continue;

        const hmRegex = /^$|^([01]?[0-9]|2[0-3]):([0-5][0-9])$/gm; //need to set it insde the loop
        const m = hmRegex.exec(timeTrim);
        if (m === null) {
            invalid.push(timeTrim);
        } else {
            valid.push({
                string: m[1].padStart(2, '0') + ':' + m[2].padStart(2, '0'),
                hours: parseInt(m[1]),
                minutes: parseInt(m[2]),
            });
        }
    }
    return {valid, invalid};
}


/**
 * Redacts sv_licenseKey, steam_webApiKey and sv_tebexSecret from a string
 * @param {string} src
 */
export const redactApiKeys = (src) => {
    if (typeof src !== 'string' || !src.length) return src;
    return src
        .replace(/licenseKey\s+["']?(cfxk_\w{1,60}_\w{1,20}|\w{32})["']?/gi, 'licenseKey [redacted cfx token]')
        .replace(/steam_webApiKey\s+["']?\w{32}["']?/gi, 'steam_webApiKey [redacted steam token]')
        .replace(/sv_tebexSecret\s+["']?\w{40}["']?/gi, 'sv_tebexSecret [redacted tebex token]');
}
