// Requires
const modulename = 'Logger:Utils';
const fsp = require('fs').promises;
const path = require('path');
const bytes = require('bytes');
const dateFormat = require('dateformat');
const rfs = require('rotating-file-stream');
const { defaultsDeep, cloneDeep } = require('lodash');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns an associative array of files in the log folder and it's sizes (human readable)
 * @param {String} basePath
 * @param {RegExp} filterRegex
 */
module.exports.getLogSizes = async (basePath, filterRegex) => {
    //Reading path
    const files = await fsp.readdir(basePath, {withFileTypes: true});
    const statOps = [];
    const statNames = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(basePath, file.name);
        if (!filterRegex.test(file.name) || !file.isFile()) continue;
        statNames.push(file.name);
        statOps.push(fsp.stat(filePath));
    }

    //Processing files
    let totalBytes = 0;
    const fileStatsSizes = await Promise.allSettled(statOps);
    const fileStatsArray = fileStatsSizes.map((op, index) => {
        totalBytes += op.value.size;
        return (op.status === 'fulfilled')
            ? [statNames[index], bytes(op.value.size)]
            : [statNames[index], false];
    });
    return {
        total: bytes(totalBytes),
        files: Object.fromEntries(fileStatsArray),
    };
};


/**
 * Default class for logger instances.
 * Implements log-rotate, listLogFiles() and getLogFile()
 */
module.exports.LoggerBase = class LoggerBase {
    constructor(basePath, logName, lrDefaultOptions, lrProfileConfig = false) {
        //FIXME: move these to private class fields as soon as eslint v8 drops
        this.lrStream = null;
        this.lrErrors = 0;
        this.lrLastError = null;
        this.basePath = null;

        //Sanity check
        if (!basePath || !logName) throw new Error('Missing LoggerBase constructor parameters');
        this.basePath = basePath;
        this.logNameRegex = new RegExp(`^${logName}(_\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}(_\\d+)?)?.log$`);

        //If disabled
        if (lrProfileConfig === false) {
            logWarn(`${logName} persistent logging disabled.`, logName);
            this.lrStream = {
                write: () => {},
            };
            return;
        }

        //Setting log rotate up
        const lrOptions = cloneDeep(lrProfileConfig);
        if (typeof lrProfileConfig === 'object') {
            defaultsDeep(lrOptions, lrDefaultOptions);
        }

        const filenameGenerator = (time, index) => {
            return time
                ? `${logName}_${dateFormat(time, 'yyyy-mm-dd_HH-MM-ss')}_${index}.log`
                : `${logName}.log`;
        };

        this.lrStream = rfs.createStream(filenameGenerator, lrOptions);
        this.lrStream.on('error', (error) => {
            if (error.code !== 'ERR_STREAM_DESTROYED') {
                if (GlobalData.verbose) logError(error, logName);
                this.lrErrors++;
                this.lrLastError = error.message;
            }
        });
    }

    listLogFiles() {
        //FIXME: provavelmente mudar como isso de regex funfa
        return module.exports.getLogSizes(this.basePath, this.logNameRegex);
    }

    getLogFile(fileName) {
        if (!this.logNameRegex.test(fileName)) throw new Error('fileName doesn\'t match regex');
        return fs.createReadStream(path.join(this.basePath, fileName));
    }
};


/**
 * Generates a multiline separator string
 */
module.exports.separator = (msg) => {
    const sepLine = '='.repeat(64);
    const timestamp = new Date().toLocaleString();
    return lines = [
        sepLine,
        `======== ${msg} - ${timestamp}`.padEnd(64, ' '),
        sepLine,
    ].join('\n');
};
