//Requires
const fs = require('fs');
const { spawnSync } = require('child_process');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');
cleanTerminal()


let configFilePath = null;
if(process.argv[2]){
    configFilePath = (process.argv[2].endsWith('.json'))? `data/${process.argv[2]}` : `data/${process.argv[2]}.json`
}else{
    logError('Server config file not set. You must start FXAdmin with the command "npm start example.json", with "example.json" being the name of the file containing your FXAdmin server configuration inside the data folder. This file should be based on the server-template.json file.', 'Config Exporter');
    process.exit(0);
}
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


Object.keys(configFile).forEach((root) => {
    log(`Configs in ${root}:`, 'CFG');
    Object.keys(configFile[root]).forEach((prop) => {
        if(prop == 'token') configFile[root][prop] = '##redacted##';
        log(`\t${prop}:\t'${configFile[root][prop]}'`, `CFG`);
    });
});


if(cfg.isLinux){
    log("Tests starting for LINUX");
}else{
    log("Tests starting for WINDOWS");
}


//Test: buildPath is readable
currTest = 'buildPath is readable';
if(fs.existsSync(cfg.buildPath)){
    logOk(currTest, 'OK')
}else{
    logError(currTest)
}

if(cfg.isLinux){
    //================================================================
    //=================================================== LINUX
    //================================================================
    //Test: buildPath contains run.sh
    currTest = 'buildPath contains run.sh';
    if(fs.existsSync(`${cfg.buildPath}/run.sh`)){
        logOk(currTest, 'OK')
    }else{
        logError(currTest, 'FAIL')
    }
}else{
    //================================================================
    //=================================================== WINDOWS
    //================================================================
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

//Test: cfgPath file (as absolute or relative) is readable
let cfgPathAbsoluteTest = fs.existsSync(cfg.cfgPath);
let cfgPathRelativeTest = fs.existsSync(`${cfg.basePath}/${cfg.cfgPath}`);
if(cfgPathAbsoluteTest || cfgPathRelativeTest){
    let which = (cfgPathAbsoluteTest)? 'absolute' : 'relative to basePath';
    logOk(`cfgPath file (as ${which}) is readable`, 'OK')
}else{
    logError('cfgPath file (as absolute or relative) is readable', 'FAIL')
}



if(cfg.isLinux){
    //================================================================
    //=================================================== LINUX
    //================================================================
    //spawn bash
    currTest = 'spawn bash';
    try {
        let spawn1 = spawnSync("/bin/bash");
        if(spawn1.pid){
            logOk(currTest, 'OK');
        }else{
            throw new Error('Process PID = '+spawn1.pid);
        }
    } catch (error) {
        logError(currTest, 'FAIL');
        dir(error);
    }


    //spawn bash -c id
    currTest = 'spawn bash -c id';
    try {
        let child = spawnSync("/bin/bash",['-c', 'id && exit']);
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


    //spawn bash with chdir to /
    currTest = 'spawn bash with chdir to /';
    try {
        let child = spawnSync("/bin/bash",['-c', 'pwd && exit'],{cwd: '/'});
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


    //spawn bash with chdir to basePath
    currTest = 'spawn bash with chdir to basePath';
    try {
        let child = spawnSync("/bin/bash",['-c', 'pwd && exit'],{cwd: cfg.basePath});
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
            "/bin/bash", 
            [`${cfg.buildPath}/run.sh`, `+exec ${cfg.cfgPath}`],
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

}else{
    //================================================================
    //=================================================== WINDOWS
    //================================================================
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
}








log("End of tests");
