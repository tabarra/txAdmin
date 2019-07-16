//Requires
const fs = require('fs');


//================================================================
/**
 * Check if the packages in package.json were installed
 */
function dependencyChecker() {
    try {
        let rawFile = fs.readFileSync('package.json');
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
            if(!process.version.startsWith('v10.')){
                console.log(`[txAdmin:PreCheck] Note: txAdmin doesn't support NodeJS ${process.version}, please install NodeJS v10 LTS!`);
            }
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
 * @param {string} basePath
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
 *  - the path is not valid (absolute or relative)
 *  - cannot read the file data
 * @param {string} cfgPath
 * @param {string} basePath
 */
function getCFGFile(cfgPath, basePath) {
    let validCfgPath;
    let rawCfgFile;
    try {
        let cfgPathAbsoluteTest = fs.existsSync(cfgPath);
        let cfgPathRelativeTest = fs.existsSync(`${basePath}/${cfgPath}`);
        if(cfgPathAbsoluteTest || cfgPathRelativeTest){
            validCfgPath = (cfgPathAbsoluteTest)? cfgPath : `${basePath}/${cfgPath}`;
        }else{
            throw new Error("Path doesn't exist or its unreadable.");
        }
        rawCfgFile = fs.readFileSync(validCfgPath).toString();
    } catch (error) {
        throw new Error("Cannot read CFG Path file.");
    }

    return rawCfgFile;
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
    let regex = /^\s*endpoint_add_(\w+)\s+["']?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\:([0-9]{1,5})["']?.?$/gim;
    // let regex = /endpoint_add_(\w+)\s+["']?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\:([0-9]{1,5})["']?.?/gi;
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

    if(!matches.length) throw new Error("No endpoints found");

    let validTCPEndpoint = matches.find((match) => {
        return (match.type.toLowerCase() === 'tcp' && match.interface === '0.0.0.0')
    })
    if(!validTCPEndpoint) throw new Error("You MUST have a TCP endpoint with interface 0.0.0.0");

    let validUDPEndpoint = matches.find((match) => {
        return (match.type.toLowerCase() === 'udp')
    })
    if(!validUDPEndpoint) throw new Error("You MUST have at least one UDP endpoint");

    matches.forEach((m) => {
        if(m.port !== matches[0].port) throw new Error("All endpoints MUST have the same port")
    });

    return matches[0].port;
}




module.exports = {
    dependencyChecker,
    parseSchedule,
    getCFGFile,
    getFXServerPort,
}
