//Requires
const modulename = 'RecipeEngine';
const fs = require('fs');
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
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
