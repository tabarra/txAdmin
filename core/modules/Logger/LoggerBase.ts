const modulename = 'Logger:Base';
import fs from 'node:fs';
import path from 'node:path';
import dateFormat from 'dateformat';
import * as rfs from 'rotating-file-stream';
import { cloneDeep, defaultsDeep } from 'lodash-es';
import consoleFactory from '@extras/console';
import { getLogSizes, getLogDivider } from './loggerUtils';
import TxAdmin from '@core/txAdmin';
const console = consoleFactory(modulename);


/**
 * Default class for logger instances.
 * Implements log-rotate, listLogFiles() and getLogFile()
 */
export class LoggerBase {
    lrStream: rfs.RotatingFileStream;
    lrErrors = 0;
    private lrLastError: string | undefined;
    private basePath: string;
    private logNameRegex: RegExp;

    constructor(
        basePath: string,
        logName: string,
        lrDefaultOptions: rfs.Options,
        lrProfileConfig: rfs.Options | false = false
    ) {
        //Sanity check
        if (!basePath || !logName) throw new Error('Missing LoggerBase constructor parameters');
        this.basePath = basePath;
        this.logNameRegex = new RegExp(`^${logName}(_\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}(_\\d+)?)?.log$`);

        //If disabled
        if (lrProfileConfig === false) {
            console.warn(`${logName} persistent logging disabled.`, logName);
            this.lrStream = {
                write: () => { },
            } as any as rfs.RotatingFileStream;
            return;
        }

        //Setting log rotate up
        const lrOptions = cloneDeep(lrProfileConfig);
        if (typeof lrProfileConfig === 'object') {
            defaultsDeep(lrOptions, lrDefaultOptions);
        }

        const filenameGenerator: rfs.Generator = (time, index) => {
            return time
                ? `${logName}_${dateFormat(time, 'yyyy-mm-dd_HH-MM-ss')}_${index}.log`
                : `${logName}.log`;
        };

        this.lrStream = rfs.createStream(filenameGenerator, lrOptions);
        this.lrStream.on('rotated', (filename) => {
            this.lrStream.write(getLogDivider('Log Rotated'));
            console.verbose.log(`Rotated file ${filename}`);
        });
        this.lrStream.on('error', (error) => {
            if ((error as any).code !== 'ERR_STREAM_DESTROYED') {
                console.verbose.error(error, logName);
                this.lrErrors++;
                this.lrLastError = error.message;
            }
        });
    }

    listLogFiles() {
        return getLogSizes(this.basePath, this.logNameRegex);
    }

    getLogFile(fileName: string) {
        if (!this.logNameRegex.test(fileName)) throw new Error('fileName doesn\'t match regex');
        return fs.createReadStream(path.join(this.basePath, fileName));
    }
};
