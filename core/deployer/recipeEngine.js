const modulename = 'RecipeEngine';
import { promisify } from 'node:util';
import fse from 'fs-extra';
import fsp from 'node:fs/promises';
import path from 'node:path';
import stream from 'node:stream';
import StreamZip from 'node-stream-zip';
import { cloneDeep, escapeRegExp } from 'lodash-es';
import mysql from 'mysql2/promise';
import got from '@lib/got';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


//Helper functions
const safePath = (base, suffix) => {
    const safeSuffix = path.normalize(suffix).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(base, safeSuffix);
};
const isPathLinear = (pathInput) => {
    return pathInput.match(/(\.\.(\/|\\|$))+/g) === null;
};
const isPathRoot = (pathInput) => {
    return /^\.[/\\]*$/.test(pathInput);
};
const pathCleanTrail = (pathInput) => {
    return pathInput.replace(/[/\\]+$/, '');
};
const isPathValid = (pathInput, acceptRoot = true) => {
    return (
        typeof pathInput == 'string'
        && pathInput.length
        && isPathLinear(pathInput)
        && (acceptRoot || !isPathRoot(pathInput))
    );
};
const replaceVars = (inputString, deployerCtx) => {
    const allVars = Object.keys(deployerCtx);
    for (const varName of allVars) {
        const varNameReplacer = new RegExp(escapeRegExp(`{{${varName}}}`), 'g');
        inputString = inputString.replace(varNameReplacer, deployerCtx[varName].toString());
    }
    return inputString;
};


/**
 * Downloads a file to a target path using streams
 */
const validatorDownloadFile = (options) => {
    return (
        typeof options.url == 'string'
        && isPathValid(options.path)
    );
};
const taskDownloadFile = async (options, basePath, deployerCtx) => {
    if (!validatorDownloadFile(options)) throw new Error('invalid options');
    if (options.path.endsWith('/')) throw new Error('target filename not specified'); //FIXME: this should be on the validator

    //Process and create target file/path
    const destPath = safePath(basePath, options.path);
    await fse.outputFile(destPath, 'file save attempt, please ignore or remove');

    //Start file download and create write stream
    deployerCtx.$step = 'before stream';
    const gotOptions = {
        timeout: { request: 150e3 },
        retry: { limit: 5 },
    };
    const gotStream = got.stream(options.url, gotOptions);
    gotStream.on('downloadProgress', (progress) => {
        deployerCtx.$step = `downloading ${Math.round(progress.percent * 100)}%`;
    });
    const pipeline = promisify(stream.pipeline);
    await pipeline(
        gotStream,
        fse.createWriteStream(destPath),
    );
    deployerCtx.$step = 'after stream';
};


/**
 * Downloads a github repository with an optional reference (branch, tag, commit hash) or subpath.
 * If the directory structure does not exist, it is created.
 */
const githubRepoSourceRegex = /^((https?:\/\/github\.com\/)?|@)?([\w.\-_]+)\/([\w.\-_]+).*$/;
const validatorDownloadGithub = (options) => {
    return (
        typeof options.src == 'string'
        && isPathValid(options.dest, false)
        && (typeof options.ref == 'string' || typeof options.ref == 'undefined')
        && (typeof options.subpath == 'string' || typeof options.subpath == 'undefined')
    );
};
const taskDownloadGithub = async (options, basePath, deployerCtx) => {
    if (!validatorDownloadGithub(options)) throw new Error('invalid options');
    //FIXME: caso seja eperm, tentar criar um arquivo na pasta e checar se funciona

    //Parsing source
    deployerCtx.$step = 'task start';
    const srcMatch = options.src.match(githubRepoSourceRegex);
    if (!srcMatch || !srcMatch[3] || !srcMatch[4]) throw new Error('invalid repository');
    const repoOwner = srcMatch[3];
    const repoName = srcMatch[4];

    //Setting git ref
    let reference;
    if (options.ref) {
        reference = options.ref;
    } else {
        const data = await got.get(
            `https://api.github.com/repos/${repoOwner}/${repoName}`,
            {
                timeout: { request: 15e3 }
            }
        ).json();
        if (typeof data !== 'object' || !data.default_branch) {
            throw new Error('reference not set, and wasn ot able to detect using github\'s api');
        }
        reference = data.default_branch;
    }
    deployerCtx.$step = 'ref set';

    //Preparing vars
    const downURL = `https://api.github.com/repos/${repoOwner}/${repoName}/zipball/${reference}`;
    const tmpFilePath = path.join(basePath, `.${(Date.now() % 100000000).toString(36)}.download`);
    const destPath = safePath(basePath, options.dest);

    //Downloading file
    deployerCtx.$step = 'before stream';
    const gotOptions = {
        timeout: { request: 150e3 },
        retry: { limit: 5 },
    };
    const gotStream = got.stream(downURL, gotOptions);
    gotStream.on('downloadProgress', (progress) => {
        deployerCtx.$step = `downloading ${Math.round(progress.percent * 100)}%`;
    });
    const pipeline = promisify(stream.pipeline);
    await pipeline(
        gotStream,
        fse.createWriteStream(tmpFilePath),
    );
    deployerCtx.$step = 'after stream';

    //Extracting files
    const zip = new StreamZip.async({ file: tmpFilePath });
    const entries = Object.values(await zip.entries());
    if (!entries.length || !entries[0].isDirectory) throw new Error('unexpected zip structure');
    const zipSubPath = path.posix.join(entries[0].name, options.subpath || '');
    deployerCtx.$step = 'zip parsed';
    await fsp.mkdir(destPath, { recursive: true });
    deployerCtx.$step = 'dest path created';
    await zip.extract(zipSubPath, destPath);
    deployerCtx.$step = 'zip extracted';
    await zip.close();
    deployerCtx.$step = 'zip closed';

    //Removing temp path
    await fse.remove(tmpFilePath);
    deployerCtx.$step = 'task finished';
};


/**
 * Removes a file or directory. The directory can have contents. If the path does not exist, silently does nothing.
 */
const validatorRemovePath = (options) => {
    return (
        isPathValid(options.path, false)
    );
};
const taskRemovePath = async (options, basePath, deployerCtx) => {
    if (!validatorRemovePath(options)) throw new Error('invalid options');

    //Process and create target file/path
    const targetPath = safePath(basePath, options.path);

    //NOTE: being extra safe about not deleting itself
    const cleanBasePath = pathCleanTrail(path.normalize(basePath));
    if (cleanBasePath == targetPath) throw new Error('cannot remove base folder');
    await fse.remove(targetPath);
};


/**
 * Ensures that the directory exists. If the directory structure does not exist, it is created.
 */
const validatorEnsureDir = (options) => {
    return (
        isPathValid(options.path, false)
    );
};
const taskEnsureDir = async (options, basePath, deployerCtx) => {
    if (!validatorEnsureDir(options)) throw new Error('invalid options');

    //Process and create target file/path
    const destPath = safePath(basePath, options.path);
    await fse.ensureDir(destPath);
};


/**
 * Extracts a ZIP file to a targt folder.
 * NOTE: wow that was not easy to pick a library!
 *  - tar: no zip files
 *  - minizlib: terrible docs, probably too low level
 *  - yauzl: deprecation warning, slow
 *  - extract-zip: deprecation warning, slow due to yauzl
 *  - jszip: it's more a browser thing than node, doesn't appear to have an extract option
 *  - archiver: no extract
 *  - zip-stream: no extract
 *  - adm-zip: 50ms the old one, shitty
 *  - node-stream-zip: 180ms, acceptable
 *  - unzip: last update 7 years ago
 *  - unzipper: haven't tested
 *  - fflate: haven't tested
 *  - decompress-zip: haven't tested
 */
const validatorUnzip = (options) => {
    return (
        isPathValid(options.src, false)
        && isPathValid(options.dest)
    );
};
const taskUnzip = async (options, basePath, deployerCtx) => {
    if (!validatorUnzip(options)) throw new Error('invalid options');

    const srcPath = safePath(basePath, options.src);
    const destPath = safePath(basePath, options.dest);
    await fsp.mkdir(destPath, { recursive: true });

    const zip = new StreamZip.async({ file: srcPath });
    const count = await zip.extract(null, destPath);
    console.log(`Extracted ${count} entries`);
    await zip.close();
};


/**
 * Moves a file or directory. The directory can have contents.
 */
const validatorMovePath = (options) => {
    return (
        isPathValid(options.src, false)
        && isPathValid(options.dest, false)
    );
};
const taskMovePath = async (options, basePath, deployerCtx) => {
    if (!validatorMovePath(options)) throw new Error('invalid options');

    const srcPath = safePath(basePath, options.src);
    const destPath = safePath(basePath, options.dest);
    await fse.move(srcPath, destPath, {
        overwrite: (options.overwrite === 'true' || options.overwrite === true),
    });
};


/**
 * Copy a file or directory. The directory can have contents.
 * TODO: add a filter property and use a glob lib in the fse.copy filter function
 */
const validatorCopyPath = (options) => {
    return (
        isPathValid(options.src)
        && isPathValid(options.dest)
    );
};
const taskCopyPath = async (options, basePath, deployerCtx) => {
    if (!validatorCopyPath(options)) throw new Error('invalid options');

    const srcPath = safePath(basePath, options.src);
    const destPath = safePath(basePath, options.dest);
    await fse.copy(srcPath, destPath, {
        overwrite: (typeof options.overwrite !== 'undefined' && (options.overwrite === 'true' || options.overwrite === true)),
    });
};


/**
 * Writes or appends data to a file. If not in the append mode, the file will be overwritten and the directory structure will be created if it doesn't exists.
 */
const validatorWriteFile = (options) => {
    return (
        typeof options.data == 'string'
        && options.data.length
        && isPathValid(options.file, false)
    );
};
const taskWriteFile = async (options, basePath, deployerCtx) => {
    if (!validatorWriteFile(options)) throw new Error('invalid options');

    const filePath = safePath(basePath, options.file);
    if (options.append === 'true' || options.append === true) {
        await fse.appendFile(filePath, options.data);
    } else {
        await fse.outputFile(filePath, options.data);
    }
};


/**
 * Replaces a string in the target file or files array based on a search string.
 * Modes:
 *  - template: (default) target string will be processed for vars
 *  - literal: normal string search/replace without any vars
 *  - all_vars: all vars.toString() will be replaced. The search option will be ignored
 */
const validatorReplaceString = (options) => {
    //Validate file
    const fileList = (Array.isArray(options.file)) ? options.file : [options.file];
    if (fileList.some((s) => !isPathValid(s, false))) {
        return false;
    }

    //Validate mode
    if (
        typeof options.mode == 'undefined'
        || options.mode == 'template'
        || options.mode == 'literal'
    ) {
        return (
            typeof options.search == 'string'
            && options.search.length
            && typeof options.replace == 'string'
        );
    } else if (options.mode == 'all_vars') {
        return true;
    } else {
        return false;
    }
};
const taskReplaceString = async (options, basePath, deployerCtx) => {
    if (!validatorReplaceString(options)) throw new Error('invalid options');

    const fileList = (Array.isArray(options.file)) ? options.file : [options.file];
    for (let i = 0; i < fileList.length; i++) {
        const filePath = safePath(basePath, fileList[i]);
        const original = await fse.readFile(filePath, 'utf8');
        let changed;
        if (typeof options.mode == 'undefined' || options.mode == 'template') {
            changed = original.replace(new RegExp(options.search, 'g'), replaceVars(options.replace, deployerCtx));
        } else if (options.mode == 'all_vars') {
            changed = replaceVars(original, deployerCtx);
        } else if (options.mode == 'literal') {
            changed = original.replace(new RegExp(options.search, 'g'), options.replace);
        }
        await fse.writeFile(filePath, changed);
    }
};


/**
 * Connects to a MySQL/MariaDB server and creates a database if the dbName variable is null.
 */
const validatorConnectDatabase = (options) => {
    return true;
};
const taskConnectDatabase = async (options, basePath, deployerCtx) => {
    if (!validatorConnectDatabase(options)) throw new Error('invalid options');
    if (typeof deployerCtx.dbHost !== 'string') throw new Error('invalid dbHost');
    if (typeof deployerCtx.dbPort !== 'number') throw new Error('invalid dbPort, should be number');
    if (typeof deployerCtx.dbUsername !== 'string') throw new Error('invalid dbUsername');
    if (typeof deployerCtx.dbPassword !== 'string') throw new Error('dbPassword should be a string');
    if (typeof deployerCtx.dbName !== 'string') throw new Error('dbName should be a string');
    if (typeof deployerCtx.dbDelete !== 'boolean') throw new Error('dbDelete should be a boolean');
    //Connect to the database
    const mysqlOptions = {
        host: deployerCtx.dbHost,
        port: deployerCtx.dbPort,
        user: deployerCtx.dbUsername,
        password: deployerCtx.dbPassword,
        multipleStatements: true,
    };
    deployerCtx.dbConnection = await mysql.createConnection(mysqlOptions);
    const escapedDBName = mysql.escapeId(deployerCtx.dbName);
    if (deployerCtx.dbDelete) {
        await deployerCtx.dbConnection.query(`DROP DATABASE IF EXISTS ${escapedDBName}`);
    }
    await deployerCtx.dbConnection.query(`CREATE DATABASE IF NOT EXISTS ${escapedDBName} CHARACTER SET utf8 COLLATE utf8_general_ci`);
    await deployerCtx.dbConnection.query(`USE ${escapedDBName}`);
};


/**
 * Runs a SQL query in the previously connected database. This query can be a file path or a string.
 */
const validatorQueryDatabase = (options) => {
    if (typeof options.file !== 'undefined' && typeof options.query !== 'undefined') return false;
    if (typeof options.file == 'string') return isPathValid(options.file, false);
    if (typeof options.query == 'string') return options.query.length;
    return false;
};
const taskQueryDatabase = async (options, basePath, deployerCtx) => {
    if (!validatorQueryDatabase(options)) throw new Error('invalid options');
    if (!deployerCtx.dbConnection) throw new Error('Database connection not found. Run connect_database before query_database');

    let sql;
    if (options.file) {
        const filePath = safePath(basePath, options.file);
        sql = await fse.readFile(filePath, 'utf8');
    } else {
        sql = options.query;
    }
    await deployerCtx.dbConnection.query(sql);
};


/**
 * Loads variables from a json file to the context.
 */
const validatorLoadVars = (options) => {
    return isPathValid(options.src, false);
};
const taskLoadVars = async (options, basePath, deployerCtx) => {
    if (!validatorLoadVars(options)) throw new Error('invalid options');

    const srcPath = safePath(basePath, options.src);
    const rawData = await fse.readFile(srcPath, 'utf8');
    const inData = JSON.parse(rawData);
    inData.dbConnection = undefined;
    Object.assign(deployerCtx, inData);
};


/**
 * DEBUG Just wastes time /shrug
 */
const validatorWasteTime = (options) => {
    return (typeof options.seconds == 'number');
};
const taskWasteTime = (options, basePath, deployerCtx) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, options.seconds * 1000);
    });
};


/**
 * DEBUG Fail fail fail :o
 */
const taskFailTest = async (options, basePath, deployerCtx) => {
    throw new Error('test error :p');
};


/**
 * DEBUG logs all ctx vars
 */
const taskDumpVars = async (options, basePath, deployerCtx) => {
    const toDump = cloneDeep(deployerCtx);
    toDump.dbConnection = toDump?.dbConnection?.constructor?.name;
    console.dir(toDump);
};


/*
DONE:
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
    - download_github (with ref and subpath)
    - load_vars

DEBUG:
    - waste_time
    - fail_test
    - dump_vars

TODO:
    - ??????
*/


//Exports
export default {
    download_file: {
        validate: validatorDownloadFile,
        run: taskDownloadFile,
        timeoutSeconds: 180,
    },
    download_github: {
        validate: validatorDownloadGithub,
        run: taskDownloadGithub,
        timeoutSeconds: 180,
    },
    remove_path: {
        validate: validatorRemovePath,
        run: taskRemovePath,
        timeoutSeconds: 15,
    },
    ensure_dir: {
        validate: validatorEnsureDir,
        run: taskEnsureDir,
        timeoutSeconds: 15,
    },
    unzip: {
        validate: validatorUnzip,
        run: taskUnzip,
        timeoutSeconds: 180,
    },
    move_path: {
        validate: validatorMovePath,
        run: taskMovePath,
        timeoutSeconds: 180,
    },
    copy_path: {
        validate: validatorCopyPath,
        run: taskCopyPath,
        timeoutSeconds: 180,
    },
    write_file: {
        validate: validatorWriteFile,
        run: taskWriteFile,
        timeoutSeconds: 15,
    },
    replace_string: {
        validate: validatorReplaceString,
        run: taskReplaceString,
        timeoutSeconds: 15,
    },
    connect_database: {
        validate: validatorConnectDatabase,
        run: taskConnectDatabase,
        timeoutSeconds: 30,
    },
    query_database: {
        validate: validatorQueryDatabase,
        run: taskQueryDatabase,
        timeoutSeconds: 90,
    },
    load_vars: {
        validate: validatorLoadVars,
        run: taskLoadVars,
        timeoutSeconds: 5,
    },

    //DEBUG only
    waste_time: {
        validate: validatorWasteTime,
        run: taskWasteTime,
        timeoutSeconds: 300,
    },
    fail_test: {
        validate: (() => true),
        run: taskFailTest,
        timeoutSeconds: 300,
    },
    dump_vars: {
        validate: (() => true),
        run: taskDumpVars,
        timeoutSeconds: 5,
    },
};
