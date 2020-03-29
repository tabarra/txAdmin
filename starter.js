//Check if running inside FXServer
try {
    if(!IsDuplicityVersion()) throw new Error();
} catch (error) {
    console.log(`txAdmin must be run inside fxserver in monitor mode.`);
    process.exit();
}

//Checking OS compatibility
const osType = require('os').type();
if (osType != 'Linux' && osType != 'Windows_NT') {
    console.log(`OS type not supported: ${osType}`);
    process.exit();
}

//Checking monitor mode and starting
const monitorMode = GetConvar('monitorMode', 'false');
if(monitorMode == 'true'){
    try {
        require('./src/index.js');
    } catch (error) {
        console.log('e'.repeat(80));
        console.log(`Resource load error: ${error.message}`);
        console.dir(error.stack);
        console.log('e'.repeat(80));
    }
}else if(GetConvar('txAdminServerMode', 'false') == 'true'){
    require('./extensions/txAdminClient/resource/sv_logger.js');
}
