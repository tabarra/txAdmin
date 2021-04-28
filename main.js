//NOTE: declaring ANY variable in this file will pollute the global scope,
//      and it will NOT be found in `Object.keys(global)`!
//      This is why I'm doing some creative data juggling in some parts

//Check if running inside FXServer
try {
    if (!IsDuplicityVersion()) throw new Error();
} catch (error) {
    console.log('txAdmin must be run inside FXServer in monitor mode!');
    process.exit();
}

//Checking monitor mode and starting
if (GetConvar('monitorMode', 'false') == 'true') {
    try {
        require('./src/index.js');
    } catch (error) {
        console.log('e'.repeat(80));
        console.log(`Resource load error: ${error.message}`);
        console.dir(error.stack);
        console.log('e'.repeat(80));
    }
} else if (GetConvar('txAdminServerMode', 'false') == 'true') {
    //Nothing, for now
}
