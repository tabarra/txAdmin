import { LOG_DATA_FILE_VERSION } from './index';
import { PDLChangeEventType, PDLFileSchema, PDLFileSchema_v1, type PDLFileType } from './playerDropSchemas';

export const migratePlayerDropsFile = async (fileData: any): Promise<PDLFileType> => {
    //Migrate from v1 to v2
    //- adding oldVersion to fxsChanged and gameChanged events
    //- remove the "Game crashed: " prefix from crash reasons
    //- renamed "user-initiated" to "player-initiated"
    //- add the "resources" counter to hourly log
    if (fileData.version === 1) {
        console.warn('Migrating your player drops stats v1 to v2.');
        const data = PDLFileSchema_v1.parse(fileData);
        const crashPrefix = 'Game crashed: ';
        let lastFxsVersion = 'unknown';
        let lastGameVersion = 'unknown';
        for (const log of data.log) {
            for (const event of log.changes as PDLChangeEventType[]) {
                if (event.type === 'fxsChanged') {
                    event.oldVersion = lastFxsVersion;
                    lastFxsVersion = event.newVersion;
                } else if (event.type === 'gameChanged') {
                    event.oldVersion = lastGameVersion;
                    lastGameVersion = event.newVersion;
                }
            }
            log.crashTypes = log.crashTypes.map(([reason, count]) => {
                const newReason = reason.startsWith(crashPrefix)
                    ? reason.slice(crashPrefix.length)
                    : reason;
                return [newReason, count];
            });
            //@ts-ignore
            log.dropTypes = log.dropTypes.map(([type, count]): [string, number] | false => {
                if (type === 'user-initiated') {
                    return ['player', count]
                } else if (type === 'server-initiated') {
                    //Mostly server shutdowns
                    return false;
                } else {
                    return [type, count];
                }
            }).filter(Array.isArray);
            //@ts-ignore
            log.resKicks = [];
        }

        fileData = {
            ...data,
            version: LOG_DATA_FILE_VERSION
        }
    }

    //Final check
    if (fileData.version === LOG_DATA_FILE_VERSION) {
        return PDLFileSchema.parse(fileData);
    } else {
        throw new Error(`Unknown file version: ${fileData.version}`);
    }
}
