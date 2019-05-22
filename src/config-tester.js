//Requires
const fs = require('fs');
const { spawnSync } = require('child_process');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');
cleanTerminal()

function fatalRequired(varName){
    logError(`The following variable was not set and is required: '${varName}'`);
    process.exit(0);
}

let configFilePath = 'data/' + (process.argv[2] || fatalRequired('server config JSON file inside your data folder'));
let configFile = null;
try {
    let raw = fs.readFileSync(configFilePath);  
    configFile = JSON.parse(raw);
} catch (error) {
    logError(`Unnable to load configuration file '${configFilePath}'`, 'Config Exporter');
    process.exit(0)
}
let cfg = configFile.fxServer;
let currTest = '';

/*
    To test:
        -buildPath is readable
        -buildPath contains run.cmd
        -buildPath contains fxserver.exe
        -basePath is readable
        -basePath contains the resources folder
        -cfgPath file (as absolute) is readable
        -cfgPath file (as relative to basePath) is readable
        -spawn cmd
        -spawn cmd /c ver
        -spawn cmd with chdir to c:/
        -spawn cmd with chdir to basePath
*/

//Test: buildPath is readable
currTest = 'buildPath is readable';
if(fs.existsSync(cfg.buildPath)){
    logOk(currTest, 'OK')
}else{
    logError(currTest)
}

//Test: buildPath contains run.cmd
currTest = 'buildPath contains run.cmd';
if(fs.existsSync(`${cfg.buildPath}/run.cmd`)){
    logOk(currTest, 'OK')
}else{
    logError(currTest, 'FAIL')
}

//Test: buildPath contains fxserver.exe
currTest = 'buildPath contains fxserver.exe';
if(fs.existsSync(`${cfg.buildPath}/fxserver.exe`)){
    logOk(currTest, 'OK')
}else{
    logError(currTest, 'FAIL')
}

//Test: basePath is readable
currTest = 'basePath is readable';
if(fs.existsSync(cfg.basePath)){
    logOk(currTest, 'OK')
}else{
    logError(currTest, 'FAIL')
}

//Test: basePath contains the resources folder
currTest = 'basePath contains the resources folder';
if(fs.existsSync(`${cfg.basePath}/resources`)){
    logOk(currTest, 'OK')
}else{
    logError(currTest, 'FAIL')
}

//Test: cfgPath file (as absolute) is readable
currTest = 'cfgPath file (as absolute) is readable';
if(fs.existsSync(cfg.cfgPath)){
    logOk(currTest, 'OK')
}else{
    logError(currTest, 'FAIL')
}

//Test: cfgPath file (as relative to basePath) is readable
currTest = 'cfgPath file (as relative to basePath) is readable';
if(fs.existsSync(`${cfg.basePath}/${cfg.cfgPath}`)){
    logOk(currTest, 'OK')
}else{
    logError(currTest, 'FAIL')
}


//spawn cmd
currTest = 'spawn cmd';
try {
    let spawn1 = spawnSync("cmd.exe");
    if(spawn1.pid){
        logOk(currTest, 'OK');
    }else{
        throw new Error('Process PID = '+spawn1.pid);
    }
} catch (error) {
    logError(currTest, 'FAIL');
    dir(error);
}


//spawn cmd /c ver
currTest = 'spawn cmd /c ver';
try {
    let child = spawnSync("cmd.exe",['/c', 'ver']);
    if(child.stderr !== null && child.stdout !== null && child.pid){
        logOk(currTest, 'OK');
        console.log(`stderr: ${child.stderr.toString()}`);
        console.log(`stdout: ${child.stdout.toString()}`);
    }else{
        throw new Error('Process PID = '+child.pid);
    }
} catch (error) {
    logError(currTest, 'FAIL');
    dir(error);
}


//spawn cmd with chdir to c:/
currTest = 'spawn cmd with chdir to c:/';
try {
    let child = spawnSync("cmd.exe",[''],{cwd: 'c:/'});
    if(child.stderr !== null && child.stdout !== null && child.pid){
        logOk(currTest, 'OK');
        console.log(`stderr: ${child.stderr.toString()}`);
        console.log(`stdout: ${child.stdout.toString()}`);
    }else{
        throw new Error('Process PID = '+child.pid);
    }
} catch (error) {
    logError(currTest, 'FAIL');
    dir(error);
}


//spawn cmd with chdir to basePath
currTest = 'spawn cmd with chdir to basePath';
try {
    let child = spawnSync("cmd.exe",[''],{cwd: cfg.basePath});
    if(child.stderr !== null && child.stdout !== null){
        logOk(currTest, 'OK');
        console.log(`stderr: ${child.stderr.toString()}`);
        console.log(`stdout: ${child.stdout.toString()}`);
    }else{
        logError(currTest, 'FAIL');
        dir(child);
    }
} catch (error) {
    logError(currTest, 'FAIL');
    dir(error);
}


//spawn full server
currTest = 'spawn full server';
try {
    let child = spawnSync(
        "cmd.exe", 
        ['/c', `${cfg.buildPath}/run.cmd +exec ${cfg.cfgPath}`],
        {cwd: cfg.basePath}
    );
    if(child.stderr !== null && child.stdout !== null){
        logOk(currTest, 'OK');
        console.log(`stderr: ${child.stderr.toString()}`);
        console.log(`stdout: ${child.stdout.toString()}`);
    }else{
        logError(currTest, 'FAIL');
        dir(child);
    }
} catch (error) {
    logError(currTest, 'FAIL');
    dir(error);
}


log("End of tests");
