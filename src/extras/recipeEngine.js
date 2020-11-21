//Requires
const modulename = 'RecipeEngine';
const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const axios = require("axios");
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
const taskDownloadFile = async (options, basePath) => {
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
const taskRemovePath = async (options, basePath) => {
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
const taskEnsureDir = async (options, basePath) => {
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
const taskUnzip = async (options, basePath) => {
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
const taskMovePath = async (options, basePath) => {
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
const taskCopyPath = async (options, basePath) => {
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
const taskWriteFile = async (options, basePath) => {
    if(!validatorWriteFile(options)) throw new Error(`invalid options`);

    const filePath = safePath(basePath, options.file);
    if(options.append === 'true' || options.append === true){
        await fs.appendFile(filePath, options.data);
    }else{
        await fs.outputFile(filePath, options.data);
    }
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
    
TODO:
    - string_replace
    - create_database (creates a database in the local mysql)
    - run_sql (runs a sql file in the database created)
MAYBE?
    - replace_file
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




/*
TODO: maybe accept multiple srcs or something?!
const validatorMovePath = (options) => {
    return (
        (
            ( 
                Array.isArray(options.src) && 
                options.src.every(s => isPathValid(s, false)) 
            ) ||
            isPathValid(options.src, false)
        ) &&
        isPathValid(options.dest, false)
    )
}
const taskMovePath = async (options, basePath) => {
    if(!validatorMovePath(options)) throw new Error(`invalid options`);

    const destPath = safePath(basePath, options.dest);
    const srcList = (Array.isArray(options.src))? options.src : [options.src];
    for (let i = 0; i < srcList.length; i++){
        const srcPath = safePath(basePath, srcList[i]);
        log(srcPath)
        await fs.move(srcPath, destPath, {
            overwrite: (options.overwrite === 'true' || options.overwrite === true)
        });
    }
}
 */
