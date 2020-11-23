//Requires
const modulename = 'RecipeEngine';
const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const axios = require("axios");
const mysql = require('mysql2/promise');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const safePath = (base, suffix) => {
    const safeSuffix = path.normalize(suffix).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(base, safeSuffix);
}
const isPathLinear = (pathInput) => {
    return pathInput.match(/(\.\.(\/|\\|$))+/g) === null;
}
const isPathRoot = (pathInput) => {
    return /^\.[\/\\]*$/.test(pathInput);
}
const pathCleanTrail = (pathInput) => {
    return pathInput.replace(/[\/\\]+$/, '');
} 
const isPathValid = (pathInput, acceptRoot=true) => {
    return (
        typeof pathInput == 'string' &&
        pathInput.length &&
        isPathLinear(pathInput) &&
        (acceptRoot || !isPathRoot(pathInput))
    )
}




/**
 * Downloads a file to a target path using streams
 */
const validatorDownloadFile = (options) => {
    return (
        typeof options.url == 'string' &&
        isPathValid(options.path)
    )
}
const taskDownloadFile = async (options, basePath, deployerCtx) => {
    if(!validatorDownloadFile(options)) throw new Error(`invalid options`);
    if(options.path.endsWith('/')) throw new Error(`target filename not specified`); //FIXME: this should be on the validator

    //Process and create target file/path
    const destPath = safePath(basePath, options.path);
    await fs.outputFile(destPath, 'file save attempt, please ignore or remove');

    //Start file download and create write stream
    const res = await axios({
        method: 'get',
        url: options.url,
        timeout: 5000,
        responseType: 'stream'
    });
    await new Promise((resolve, reject) => {
        const outStream = fs.createWriteStream(destPath);
        res.data.pipe(outStream)
        outStream.on("finish", resolve);
        outStream.on("error", reject); // don't forget this!
    });
}


/**
 * Removes a file or directory. The directory can have contents. If the path does not exist, silently does nothing.
 */
const validatorRemovePath = (options) => {
    return (
        isPathValid(options.path, false)
    )
}
const taskRemovePath = async (options, basePath, deployerCtx) => {
    if(!validatorRemovePath(options)) throw new Error(`invalid options`);

    //Process and create target file/path
    const destPath = safePath(basePath, options.path);

    //NOTE: being extra safe about not deleting itself
    const cleanBasePath = pathCleanTrail(path.normalize(basePath));
    if(cleanBasePath == destPath) throw new Error(`cannot remove base folder`);
    await fs.remove(destPath);
}


/**
 * Ensures that the directory exists. If the directory structure does not exist, it is created.
 */
const validatorEnsureDir = (options) => {
    return (
        isPathValid(options.path, false)
    )
}
const taskEnsureDir = async (options, basePath, deployerCtx) => {
    if(!validatorEnsureDir(options)) throw new Error(`invalid options`);

    //Process and create target file/path
    const destPath = safePath(basePath, options.path);
    await fs.ensureDir(destPath);
}


/**
 * Extracts a ZIP file to a targt folder.
 * NOTE: wow that was not easy to pick a library!
 *          - extract-zip: throws deprecation warnings
 *          - decompress: super super super slow!
 *          - adm-zip: bad docs, not promise-native, full of issues on github
 *          - tar << não abre zip
 *          - unzipper << não testei ainda
 */
const validatorUnzip = (options) => {
    return (
        isPathValid(options.src, false) &&
        isPathValid(options.dest)
    )
}
const taskUnzip = async (options, basePath, deployerCtx) => {
    if(!validatorUnzip(options)) throw new Error(`invalid options`);

    const srcPath = safePath(basePath, options.src);
    //maybe ensure dest doesn't seem to be an issue?
    const destPath = safePath(basePath, options.dest);

    const zip = new AdmZip(srcPath);
    const extract = util.promisify(zip.extractAllToAsync);
    await extract(destPath, true);
}


/**
 * Moves a file or directory. The directory can have contents.
 */
const validatorMovePath = (options) => {
    return (
        isPathValid(options.src, false) &&
        isPathValid(options.dest, false)
    )
}
const taskMovePath = async (options, basePath, deployerCtx) => {
    if(!validatorMovePath(options)) throw new Error(`invalid options`);

    const srcPath = safePath(basePath, options.src);
    const destPath = safePath(basePath, options.dest);
    await fs.move(srcPath, destPath, {
        overwrite: (options.overwrite === 'true' || options.overwrite === true)
    });
}


/**
 * Copy a file or directory. The directory can have contents.
 * TODO: add a filter property and use a glob lib in the fs.copy filter function
 */
const validatorCopyPath = (options) => {
    return (
        isPathValid(options.src) &&
        isPathValid(options.dest)
    )
}
const taskCopyPath = async (options, basePath, deployerCtx) => {
    if(!validatorCopyPath(options)) throw new Error(`invalid options`);

    const srcPath = safePath(basePath, options.src);
    const destPath = safePath(basePath, options.dest);
    await fs.copy(srcPath, destPath, {
        overwrite: (typeof options.overwrite !== 'undefined' && (options.overwrite === 'true' || options.overwrite === true))
    });
}


/**
 * Writes or appends data to a file. If not in the append mode, the file will be overwritten and the directory structure will be created if it doesn't exists.
 */
const validatorWriteFile = (options) => {
    return (
        typeof options.data == 'string' &&
        options.data.length &&
        isPathValid(options.file, false)
    )
}
const taskWriteFile = async (options, basePath, deployerCtx) => {
    if(!validatorWriteFile(options)) throw new Error(`invalid options`);

    const filePath = safePath(basePath, options.file);
    if(options.append === 'true' || options.append === true){
        await fs.appendFile(filePath, options.data);
    }else{
        await fs.outputFile(filePath, options.data);
    }
}


/**
 * Replaces a string in the target file or files array based on a search string.
 */
const validatorReplaceString = (options) => {
    return (
        (
            ( 
                Array.isArray(options.file) && 
                options.file.every(s => isPathValid(s, false)) 
            ) ||
            isPathValid(options.file, false)
        ) &&
        typeof options.search == 'string' &&
        options.search.length &&
        typeof options.replace == 'string'
    )
}
const taskReplaceString = async (options, basePath, deployerCtx) => {
    if(!validatorReplaceString(options)) throw new Error(`invalid options`);

    const fileList = (Array.isArray(options.file))? options.file : [options.file];
    for (let i = 0; i < fileList.length; i++){
        const filePath = safePath(basePath, fileList[i]);
        const original = await fs.readFile(filePath);
        const changed = original.toString().replace(options.search, options.replace);
        await fs.writeFile(filePath, changed);
    }
}


/**
 * Connects to a MySQL/MariaDB server and creates a database if the dbName variable is null.
 */
const validatorConnectDatabase = (options) => {
    return true;
}
const taskConnectDatabase = async (options, basePath, deployerCtx) => {
    if(!validatorConnectDatabase(options)) throw new Error(`invalid options`);
    if(typeof deployerCtx.deploymentID !== 'string' || !deployerCtx.deploymentID.length) throw new Error(`invalid deploymentID`);
    if(typeof deployerCtx.dbHost !== 'string') throw new Error(`invalid dbHost`);
    if(typeof deployerCtx.dbUsername !== 'string') throw new Error(`invalid dbUsername`);
    if(typeof deployerCtx.dbPassword !== 'string' && deployerCtx.dbPassword !== null) throw new Error(`dbPassword should be a string or null`);
    if(typeof deployerCtx.dbName !== 'string' && deployerCtx.dbName !== null) throw new Error(`dbName should be a string or null`);

    //Connect to the database
    const mysqlOptions = {
        host: deployerCtx.dbHost,
        user: deployerCtx.dbUsername,
        password: (deployerCtx.dbPassword)? deployerCtx.dbPassword : undefined,
        database: (deployerCtx.dbName)? deployerCtx.dbName : undefined,
        multipleStatements: true,
    }
    deployerCtx.mysqlCon = await mysql.createConnection(mysqlOptions);
    if(deployerCtx.dbName == null){
        const escapedName = mysql.escapeId(deployerCtx.deploymentID);
        if(deployerCtx.dbOverwrite === 'yes_delete_existing_database'){
            await deployerCtx.mysqlCon.query(`DROP DATABASE IF EXISTS ${escapedName}`);
        }
        await deployerCtx.mysqlCon.query(`CREATE DATABASE IF NOT EXISTS ${escapedName}`);
        await deployerCtx.mysqlCon.query(`USE ${escapedName}`);
    }
}


/**
 * Runs a SQL query in the previously connected database. This query can be a file path or a string.
 */
const validatorQueryDatabase = (options) => {
    if(typeof options.file !== 'undefined' && typeof options.query !== 'undefined') return false;
    if(typeof options.file == 'string') return isPathValid(options.file, false);
    if(typeof options.query == 'string') return options.query.length;
    return false;
}
const taskQueryDatabase = async (options, basePath, deployerCtx) => {
    if(!validatorQueryDatabase(options)) throw new Error(`invalid options`);
    if(!deployerCtx.mysqlCon) throw new Error(`Database connection not found. Run connect_database before query_database`);

    let sql;
    if(options.file){
        const filePath = safePath(basePath, options.file);
        sql = await fs.readFile(filePath, 'utf8');
    }else{
        sql = options.query;
    }
    await deployerCtx.mysqlCon.query(sql);
}



/**
 * DEBUG Just wastes time /shrug
 */
const validatorWasteTime = (options) => {
    return (typeof options.seconds == 'number')
}
const taskWasteTime = (options, target) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, options.seconds * 1000);
    })
}


/**
 * DEBUG Fail fail fail :o
 */
const validatorFailTest = (options) => {
    return true;
}
const taskFailTest = async (options, target) => {
    throw new Error(`test error :p`);
}


/*
DONE:
    - waste_time (DEBUG)
    - fail_test (DEBUG)
    - download_file
    - remove_path (file or folder)
    - ensure_dir
    - unzip
    - move_path (file or folder)
    - copy_path (file or folder)
    - write_file (with option to append only)
    - replace_string (single or array)
    - connect_database (connects to mysql, creates db if not set)
    - query_database (file or string)
    
TODO:
    - read json into context vars?
    - print vars to console?
    - github_extract: automatiza toda a parte de download, unzip, move e rm temp
        - url
        - tag
        - subfolders?
        - dest path


https://api.github.com/repos/tabarra/txAdmin/zipball/master
https://api.github.com/repos/tabarra/txAdmin/zipball/v2.7.2
https://api.github.com/repos/tabarra/txAdmin/zipball/778bc41aa7a66ff9b37acdbfcb4c6cd957c8614e

https://api.github.com/repos/tabarra/txAdmin/releases
https://api.github.com/repos/tabarra/txAdmin/releases/latest
*/


//Exports
module.exports = {
    download_file:{
        validate: validatorDownloadFile,
        run: taskDownloadFile,
    },
    remove_path:{
        validate: validatorRemovePath,
        run: taskRemovePath,
    },
    ensure_dir:{
        validate: validatorEnsureDir,
        run: taskEnsureDir,
    },
    unzip:{
        validate: validatorUnzip,
        run: taskUnzip,
    },
    move_path:{
        validate: validatorMovePath,
        run: taskMovePath,
    },
    copy_path:{
        validate: validatorCopyPath,
        run: taskCopyPath,
    },
    write_file:{
        validate: validatorWriteFile,
        run: taskWriteFile,
    },
    replace_string:{
        validate: validatorReplaceString,
        run: taskReplaceString,
    },
    connect_database:{
        validate: validatorConnectDatabase,
        run: taskConnectDatabase,
    },
    query_database:{
        validate: validatorQueryDatabase,
        run: taskQueryDatabase,
    },

    //DEBUG mock only
    waste_time:{
        validate: validatorWasteTime,
        run: taskWasteTime,
    },
    fail_test:{
        validate: validatorFailTest,
        run: taskFailTest,
    },
}
