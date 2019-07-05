//Requires
const fs = require('fs');

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



module.exports = {
    dependencyChecker,
}
