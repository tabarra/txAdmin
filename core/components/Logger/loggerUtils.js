const modulename = 'Logger:Utils';
import fsp from 'node:fs/promises';
import path from 'node:path';
import bytes from 'bytes';
import dateFormat from 'dateformat';
import rfs from 'rotating-file-stream';
import { cloneDeep, defaultsDeep }  from 'lodash-es';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns an associative array of files in the log folder and it's sizes (human readable)
 * @param {String} basePath
 * @param {RegExp} filterRegex
 */
export const getLogSizes = async (basePath, filterRegex) => {
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
 export class LoggerBase {
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
                if (verbose) logError(error, logName);
                this.lrErrors++;
                this.lrLastError = error.message;
            }
        });
    }

    listLogFiles() {
        //FIXME: provavelmente mudar como isso de regex funfa
        return getLogSizes(this.basePath, this.logNameRegex);
    }

    getLogFile(fileName) {
        if (!this.logNameRegex.test(fileName)) throw new Error('fileName doesn\'t match regex');
        return fs.createReadStream(path.join(this.basePath, fileName));
    }
};


/**
 * Generates a multiline separator string
 */
 export const separator = (msg) => {
    const sepLine = '='.repeat(64);
    const timestamp = new Date().toLocaleString();
    return [
        sepLine,
        `======== ${msg} - ${timestamp}`.padEnd(64, ' '),
        sepLine,
    ].join('\n');
};
