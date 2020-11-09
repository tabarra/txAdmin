//Requires
const modulename = 'RecipeEngine';
const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const safePath = (base, suffix) => {
    const safeSuffix = path.normalize(suffix).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(base, safeSuffix);
}


/**
 * Clones an git repository to a target folder with a target name
 */
const validatorCloneRepo = (options) => {
    return (
        typeof options.url == 'string' &&
        typeof options.path == 'string' &&
        options.path.match(/(\.\.(\/|\\|$))+/g) === null
    )
}
const taskCloneRepo = async (options, target) => {
    if(!validatorCloneRepo(options)) throw new Error(`invalid options`);
    dir(`taskCloneRepo deploying to to: ` + safePath(target, options.path));

/**
 * Downloads a file to a target path using streams
 */
const validatorDownloadFile = (options) => {
    return (
        typeof options.url == 'string' &&
        typeof options.path == 'string' &&
        options.path.length &&
        options.path.match(/(\.\.(\/|\\|$))+/g) === null
    )
}
const taskDownloadFile = async (options, target) => {
    if(!validatorDownloadFile(options)) throw new Error(`invalid options`);
    if(options.path.endsWith('/')) throw new Error(`target filename not specified`); //FIXME: this should be on the validator

    //Process and create target file/path
    const destPath = safePath(target, options.path);
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
 * Just wastes time /shrug
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
 * Fail fail fail :o
 */
const validatorFailTest = (options) => {
    return true;
}
const taskFailTest = async (options, target) => {
    throw new Error(`test error :p`);
}


//Exports
module.exports = {
    tasks: {
        clone_repo:{
            validate: validatorCloneRepo,
            run: taskCloneRepo,
        },
        download_file:{
            validate: validatorDownloadFile,
            run: taskDownloadFile,
        },
        waste_time:{
            validate: validatorWasteTime,
            run: taskWasteTime,
        },
        fail_test:{
            validate: validatorFailTest,
            run: taskFailTest,
        },
    }
}
