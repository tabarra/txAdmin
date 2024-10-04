/**
 * This script is used to merge multiple stats_playerDrop files into a single file with the last 336 hours of data.
 * NOTE: use npx tsx scripts/dev/makeOldStatsFile.local.ts to run this script
 */
import fs from 'node:fs';
import { shuffle } from 'd3-array';
import { PDLChangeEventType, PDLFileType } from '../../core/components/StatsManager/playerDrop/playerDropSchemas';
import { MultipleCounter } from '../../core/components/StatsManager/statsUtils';


type CountersType = {
    drops: MultipleCounter,
    resKicks: MultipleCounter,
    crashes: MultipleCounter,
    changes: PDLChangeEventType[],
};

const getRandomResource = () => {
    const pool = [
        'anticheat', 'anticheat', 'anticheat', 'anticheat',
        'txAdmin', 'txAdmin', 'txAdmin',
        'vMenu',
        'es_extended',
    ];
    return pool[Math.floor(Math.random() * pool.length)];
}


export default (sourceFiles: string[], targetFileName: string) => {
    let logCounters: CountersType[] = [];
    for (const fileName of sourceFiles) {
        const fileData = JSON.parse(fs.readFileSync(fileName, 'utf8')) as PDLFileType;
        console.log('fileData.log.length:', fileData.log.length);
        for (const log of fileData.log) {
            const resKicks = new MultipleCounter();
            const drops = log.dropTypes.map(([type, count]): [string, number] | false => {
                if (type === 'user-initiated') {
                    return ['player', count]
                } else if (type === 'server-initiated') {
                    resKicks.count('txAdmin', count);
                    return ['resource', count];
                } else if (type === 'unknown') {
                    if (Math.random() <= 0.2) {
                        return [type, count];
                    } else {
                        resKicks.count(getRandomResource(), count);
                        return ['resource', count];
                    }
                } else {
                    return [type, count];
                }
            }).filter((x): x is [string, number] => Array.isArray(x));


            logCounters.push({
                // drops: new MultipleCounter(log.dropTypes.filter(([type]) => type !== 'server-initiated')),
                drops: new MultipleCounter(drops),
                resKicks: resKicks,
                crashes: new MultipleCounter(log.crashTypes),
                changes: log.changes,
            });
        }
    }
    console.log('Logs Hours:', logCounters.length);


    //Shuffle and merge all crashes into 336 MultipleCounters and shuffle them again
    logCounters = shuffle(logCounters);
    let mergedCounters: CountersType[] = [];
    for (let i = 0; i < logCounters.length; i++) {
        const writeIndex = i % 336;
        const currCounters = logCounters[i];
        if (!mergedCounters[writeIndex]) {
            mergedCounters[writeIndex] = currCounters;
        } else {
            mergedCounters[writeIndex].drops.merge(currCounters.drops);
            mergedCounters[writeIndex].resKicks.merge(currCounters.resKicks);
            mergedCounters[writeIndex].crashes.merge(currCounters.crashes);
            mergedCounters[writeIndex].changes.push(...currCounters.changes);
        }

    }
    mergedCounters = shuffle(mergedCounters);
    console.log('mergedCrashes.length:', mergedCounters.length);


    //Prepare new hours array
    const last336Hours: Date[] = [];
    const currentDate = new Date();
    currentDate.setMinutes(0, 0, 0);
    for (let i = 335; i >= 0; i--) {
        const hour = new Date(currentDate.getTime() - i * 60 * 60 * 1000);
        last336Hours.push(hour);
    }
    console.log('last336Hours.length:', last336Hours.length);


    //Prepare new log with the data
    const newLog: PDLFileType['log'] = [];
    for (const hour of last336Hours) {
        const counters = mergedCounters.pop()!;
        const newHour = {
            hour: hour.toISOString(),
            changes: counters?.changes ?? [],
            dropTypes: counters?.drops.toArray() ?? [],
            resKicks: counters?.resKicks.toArray() ?? [],
            crashTypes: counters?.crashes.toArray() ?? [],
        };
        newLog.push(newHour);
        console.dir({
            hour: newHour.hour,
            changes: newHour.changes.length,
            drops: counters.drops.sum(),
            resKicks: counters.resKicks.sum(),
            crashes: counters.crashes.sum(),
        });
    }


    //Write new file
    const newStatsFile: PDLFileType = {
        version: 2,
        lastGameVersion: 'unknown',
        lastServerVersion: 'unknown',
        lastResourceList: [],
        lastUnknownReasons: [],
        log: newLog,
    }
    fs.writeFileSync(targetFileName, JSON.stringify(newStatsFile));
}
