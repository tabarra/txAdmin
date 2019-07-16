//Requires
const fs = require('fs');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'TimeSeries';

const isUndefined = (x) => { return (typeof x === 'undefined') };
const now = (x) => { return (new Date() / 1000).toFixed() };

/**
 * Simple Integer Time Series class with json file persistence
 * It implements a minimum resolution and a max window for the data.
 *
 * NOTE: Except for the constructor, this class will not return any errors,
 *       and should not be used to anything that requires data consistency.
 */
module.exports = class TimeSeries {
    constructor(file, resolution, window) {
        if (isUndefined(file) || isUndefined(resolution) || isUndefined(window)) {
            throw new Error('All parameters must be defined');
        }
        this.file = file;
        this.resolution = resolution;
        this.window = window;
        this.maxEntries = (window / resolution).toFixed(0);


        //Load previous data
        let rawFile;
        try {
            rawFile = fs.readFileSync(file, 'utf8');
        } catch (error) {
            try {
                fs.writeFileSync(file, '[]');
                rawFile = '[]';
            } catch (error) {
                throw new Error('Unnable to create timeseries file.');
            }
        }

        //Parse & clean previous data
        let oldData;
        try {
            oldData = JSON.parse(rawFile);
            oldData.filter((point) => {
                return (
                    !isUndefined(point.timestamp) &&
                    Number.isInteger(point.timestamp) &&
                    !isUndefined(point.data) &&
                    Number.isInteger(point.data) &&
                    now() - point.timestamp < window
                );
            });
        } catch (error) {
            oldData = [];
        }

        this.log = oldData;
    }


    //================================================================
    /**
     * Adds a new datapoint
     * @param {string} data
     */
    add(value) {
        let currTs = now();
        if (
            !this.log.length ||
            (currTs - this.log[this.log.length - 1].timestamp) > this.resolution
        ) {
            this.log.push({
                timestamp: currTs,
                value: value
            });
        }

        if (this.log.length > this.maxEntries) this.log.shift();
        // dir(this.log)

        try {
            fs.writeFile(this.file, JSON.stringify(this.log), () => { });
        } catch (error) {
            if (globals.config.verbose) logWarn('Error writing the player history log file.', context);
        }
    }


    //================================================================
    /**
     * Returns the series
     */
    get() {
        let currTs = now();
        this.log.filter((point) => {
            return (now - point.timestamp < this.window);
        });

        return clone(this.log);
    }


} //Fim TimeSeries()
