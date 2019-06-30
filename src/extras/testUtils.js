//Requires
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./console');
const context = 'TestUtils';


//================================================================
/**
 * Check if running on NodeJS v10 LTS
 */
function nodeVersionChecker(){
    if(!process.version.startsWith('v10.')){
        cleanTerminal();
        logError(`FATAL ERROR: txAdmin doesn't support NodeJS ${process.version}, please install NodeJS v10 LTS!`, 'NodeVersionChecker');
        process.exit();
    }
}


//================================================================
/**
 * Check if the packages in package.json were installed
 */
function moduleInstallChecker() {
    let errorOut;
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
            errorOut = `Make sure you executed 'npm i'. The following packages are missing:\n` + missing.join(', ');
        }
    } catch (error) {
        errorOut = `Error reading or parsing package.json: ${error.message}`;
    }

    if(errorOut){
        logError(errorOut, 'PackageChecker');
        process.exit();
    }
}



module.exports = {
    nodeVersionChecker,
    moduleInstallChecker,
}
