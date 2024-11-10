import fs from 'node:fs';
import { SvRtFileType } from '../../core/modules/Metrics/svRuntime/perfSchemas';
import * as d3 from 'd3';

type SourceFileDataType = {
    ts: number;
    players: number;
}

export default (sourceFileName: string, targetFileName: string) => {
    const sourceFileData = JSON.parse(fs.readFileSync(sourceFileName, 'utf8')) as SourceFileDataType[];
    const targetFileData = JSON.parse(fs.readFileSync(targetFileName, 'utf8')) as SvRtFileType;

    const maxAllowedGap = 90 * 60 * 1000;//90mins
    const timeBisector = d3.bisector((d: SourceFileDataType) => d.ts).center;

    for (let i = 0; i < targetFileData.log.length; i++) {
        const log = targetFileData.log[i];
        if (log.type !== 'data') continue;
        const indexFound = timeBisector(sourceFileData, log.ts);
        if (indexFound === -1) continue;
        if (log.players > 0 && log.players < 200) {
            console.log('Skipped', log.players);
            continue;
        }
        const sourceData = sourceFileData[indexFound];
        if (Math.abs(sourceData.ts - log.ts) > maxAllowedGap) {
            console.log('Replaced', 45);
            log.players = 45;
        } else {
            console.log('Replaced', sourceData.players);
            log.players = sourceData.players;
        }
    }

    fs.writeFileSync(targetFileName, JSON.stringify(targetFileData));
}
