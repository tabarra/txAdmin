//Requires
const fs = require('fs');
const path = require('path');


//================================================================
/**
 * txAdmin in ASCII
 */
function txAdminASCII() {
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
        let packages = Object.keys(parsedFile.dependencies)
        let missing = [];
        packages.forEach(package => {
            try {
                require.resolve(package);
            } catch (error) {
                missing.push(package);
            }
        });
        if(missing.length){
            console.log(`[txAdmin:PreCheck] Cannot start txAdmin due to missing dependencies.`);
            console.log(`[txAdmin:PreCheck] Make sure you executed 'npm i'.`);
            console.log(`[txAdmin:PreCheck] The following packages are missing: ` + missing.join(', '));
            process.exit();
        }
    } catch (error) {
        console.log(`[txAdmin:PreCheck] Error reading or parsing package.json: ${error.message}`);
        process.exit();
    }
}


//================================================================
/**
 * Reads CFG Path and return the file contents, or throw error if:
 *  - the path is not valid (absolute or relative)
 *  - cannot read the file data
 * @param {string} cfgPath
 * @param {string} serverDataPath
 */
function parseSchedule(schedule, filter) {
    if(typeof filter === 'undefined') filter = true;
    times = (typeof schedule === 'string')? schedule.split(',') : schedule;
    let out = []
    times.forEach((time) => {
        if(!time.length) return;
        const regex = /^$|^([01]?[0-9]|2[0-3]):([0-5][0-9])$/gm;
        let m = regex.exec(time.trim())
        if(m === null){
            if(!filter) out.push(time);
        }else{
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
 * Reads CFG Path and return the file contents, or throw error if:
 *  - the path is not valid (must be absolute)
 *  - cannot read the file data
 * @param {string} cfgFullPath
 */
function getCFGFileData(cfgPath) {
    //Validating if the path is absolute
    if(!path.isAbsolute(cfgPath)){
        throw new Error("File path must be absolute.");
    }

    //Validating file existence
    if(!fs.existsSync(cfgPath)){
        throw new Error("File doesn't exist or its unreadable.");
    }

    //Validating if its actually a file
    if(!fs.lstatSync(cfgPath).isFile()){
        throw new Error("File doesn't exist or its unreadable. Make sure to include the CFG file in the path, and not just the directory that contains it.");
    }

    //Reading file
    try {
        return fs.readFileSync(cfgPath).toString();
    } catch (error) {
        throw new Error("Cannot read CFG Path file.");
    }
}


//================================================================
/**
 * Returns the absolute path of the given CFG Path
 * @param {string} cfgPath
 * @param {string} serverDataPath
 */
function resolveCFGFilePath(cfgPath, serverDataPath) {
    return (path.isAbsolute(cfgPath))? cfgPath : path.resolve(serverDataPath, cfgPath);
}


//================================================================
/**
 * Processes cfgPath and returns the fxserver port or throw errors if:
 *  - Regex Match Error
 *  - no endpoints found
 *  - endpoints that are not 0.0.0.0:xxx
 *  - port mismatch
 * @param {string} rawCfgFile
 */
function getFXServerPort(rawCfgFile) {
    let regex = /^\s*endpoint_add_(\w+)\s+["']?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\:([0-9]{1,5})["']?.*$/gim;
    // let regex = /endpoint_add_(\w+)\s+["']?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\:([0-9]{1,5})["']?.*/gi;
    let matches = [];
    try {
        let match;
        while (match = regex.exec(rawCfgFile)) {
            let matchData = {
                line: match[0].trim(),
                type: match[1],
                interface: match[2],
                port: match[3],
            }
            matches.push(matchData);
        }
    } catch (error) {
        throw new Error("Regex Match Error");
    }

    if(!matches.length) throw new Error("No <code>endpoint_add_*</code> found inside the file");

    let validTCPEndpoint = matches.find((match) => {
        return (match.type.toLowerCase() === 'tcp' && (match.interface === '0.0.0.0' || match.interface === '127.0.0.1'))
    })
    if(!validTCPEndpoint) throw new Error("You MUST have one <code>endpoint_add_tcp</code> with IP 0.0.0.0 in your config");

    let validUDPEndpoint = matches.find((match) => {
        return (match.type.toLowerCase() === 'udp')
    })
    if(!validUDPEndpoint) throw new Error("You MUST have at least one <code>endpoint_add_udp</code> in your config");

    //FIXME: Think of something to make this work:
    //  https://forum.fivem.net/t/release-txadmin-manager-discord-bot-live-console-playerlist-autorestarter/530475/348?u=tabarra
    matches.forEach((m) => {
        if(m.port !== matches[0].port) throw new Error("All <code>endpoint_add_*</code> MUST have the same port")
    });

    return matches[0].port;
}



module.exports = {
    txAdminASCII,
    dependencyChecker,
    parseSchedule,
    getCFGFileData,
    resolveCFGFilePath,
    getFXServerPort,
}
