/**
 * This script is used to merge multiple stats_playerDrop files into a single file with the last 336 hours of data.
 * NOTE: use npx tsx scripts/makeOldStatsFile.ts to run this script
 */
import fs from 'node:fs';
import { shuffle } from 'd3-array';
import { PDLChangeEventType_V1, PDLFileType_v1 } from '../../core/components/StatsManager/playerDrop/playerDropSchemas';
import { MultipleCounter } from '../../core/components/StatsManager/statsUtils';


type CountersType = {
    drops: MultipleCounter,
    crashes: MultipleCounter,
    changes: PDLChangeEventType_V1[],
};


export default (sourceFiles: string[], targetFileName: string) => {
    let logCounters: CountersType[] = [];
    for (const fileName of sourceFiles) {
        const fileData = JSON.parse(fs.readFileSync(fileName, 'utf8')) as PDLFileType_v1;
        console.log('fileData.log.length:', fileData.log.length);
        for (const log of fileData.log) {
            logCounters.push({
                // drops: new MultipleCounter(log.dropTypes.filter(([type]) => type !== 'server-initiated')),
                drops: new MultipleCounter(log.dropTypes),
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
    const newLog: PDLFileType_v1['log'] = [];
    for (const hour of last336Hours) {
        const counters = mergedCounters.pop()!;
        const newHour = {
            hour: hour.toISOString(),
            changes: counters?.changes ?? [],
            dropTypes: counters?.drops.toArray() ?? [],
            crashTypes: counters?.crashes.toArray() ?? [],
        };
        newLog.push(newHour);
        console.dir({
            hour: newHour.hour,
            changes: newHour.changes.length,
            drops: counters.drops.sum(),
            crashes: counters.crashes.sum(),
        });
    }


    //Write new file
    const newStatsFile: PDLFileType_v1 = {
        version: 1,
        lastGameVersion: 'idk',
        lastServerVersion: 'idk',
        lastResourceList: [],
        lastUnknownReasons: [],
        log: newLog,
    }
    fs.writeFileSync(targetFileName, JSON.stringify(newStatsFile));
}
