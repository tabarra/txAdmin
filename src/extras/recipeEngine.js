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




/**
 * Downloads a file to a target path using streams
 */
const validatorDownloadFile = (options) => {
    return (
        typeof options.url == 'string' &&
        typeof options.path == 'string' &&
        options.path.length &&
        isPathLinear(options.path)
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
        typeof options.path == 'string' &&
        options.path.length &&
        isPathLinear(options.path) &&
        !isPathRoot(options.path)
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
        typeof options.path == 'string' &&
        options.path.length &&
        isPathLinear(options.path) &&
        !isPathRoot(options.path)
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
        typeof options.src == 'string' &&
        options.src.length &&
        isPathLinear(options.src) &&
        typeof options.dest == 'string' &&
        options.dest.length &&
        isPathLinear(options.dest)
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
 * Moves a file or directory
 */
const validatorMovePath = (options) => {
    return (
        typeof options.src == 'string' &&
        options.src.length &&
        isPathLinear(options.src) &&
        !isPathRoot(options.src) &&
        typeof options.dest == 'string' &&
        options.dest.length &&
        isPathLinear(options.dest) &&
        !isPathRoot(options.dest)
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
    
TODO:
    - copy_path (file or folder)
    - string_replace
    - create_database (creates a database in the local mysql)
    - run_sql (runs a sql file in the database created)
    - write_file (with option to append only)

    - replace_file
    - read json into context vars?
    - print vars to console?
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
