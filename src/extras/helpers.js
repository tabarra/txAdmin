//Requires
const fs = require('fs');
const path = require('path');
let xss; //can't be required before the dependency check
//const log = (x) => process.stdout.write(JSON.stringify(x, null, 2) + '\n');


//================================================================
/**
 * txAdmin in ASCII
 */
let __ascii;
function txAdminASCII() {
    //NOTE: precalculating the ascii art for efficiency
    // const figlet = require('figlet');
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


//================================================================
/**
 * Check if the packages in package.json were installed
 */
function dependencyChecker() {
    if (process.env.APP_ENV === 'webpack') {
        return;
    }

    try {
        let rawFile = fs.readFileSync(GetResourcePath(GetCurrentResourceName()) + '/package.json');
        let parsedFile = JSON.parse(rawFile);
        let packages = Object.keys(parsedFile.dependencies);
        let missing = [];
        packages.forEach((package) => {
            try {
                require.resolve(package);
            } catch (error) {
                missing.push(package);
            }
        });
        if (missing.length) {
            console.log('[txAdmin:PreCheck] Cannot start txAdmin due to missing dependencies.');
            console.log('[txAdmin:PreCheck] Make sure you executed \'npm i\'.');
            console.log('[txAdmin:PreCheck] The following packages are missing: ' + missing.join(', '));
            console.log();
            console.log('[txAdmin:PreCheck] GO THE THE GITHUB RELEASES PAGE AND DOWNLOAD THE COMPILED ZIP FILE INSTEAD OF THE SOURCE');
            process.exit();
        }
    } catch (error) {
        console.log(`[txAdmin:PreCheck] Error reading or parsing package.json: ${error.message}`);
        process.exit();
    }
}


//================================================================
/**
 * Extracts hours and minutes from an string containing times
 * @param {string} schedule
 * @param {boolean} filter default true
 */
function parseSchedule(schedule, filter = true) {
    const times = (typeof schedule === 'string') ? schedule.split(',') : schedule;
    let out = [];
    times.forEach((time) => {
        if (!time.length) return;
        const regex = /^$|^([01]?[0-9]|2[0-3]):([0-5][0-9])$/gm;
        let m = regex.exec(time.trim());
        if (m === null) {
            if (!filter) out.push(time);
        } else {
            out.push({
                string: m[0],
                hour: parseInt(m[1]),
                minute: parseInt(m[2]),
            });
        }
    });

    return out;
}





//================================================================
/**
 * Redacts sv_licenseKey, steam_webApiKey and sv_tebexSecret from a string
 * @param {string} src
 */
function redactApiKeys(src) {
    if (typeof src !== 'string' || !src.length) return src;
    return src
        .replace(/licenseKey\s+["']?(cfxk_\w{1,60}_\w{1,20}|\w{32})["']?/gi, 'licenseKey [redacted cfx token]')
        .replace(/steam_webApiKey\s+["']?\w{32}["']?/gi, 'steam_webApiKey [redacted steam token]')
        .replace(/sv_tebexSecret\s+["']?\w{40}["']?/gi, 'sv_tebexSecret [redacted tebex token]');
}

module.exports = {
    txAdminASCII,
    dependencyChecker,
    parseSchedule,
    redactApiKeys,
};
