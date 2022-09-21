import consts from '@core/extras/consts';
import { cleanPlayerName } from '@core/extras/shared';
import { PlayerDbDataType } from '../PlayerDatabase/index.js';

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };

type PlayerDataType = {
    name: string,
    ids: string[],
    hwids: string[],
}

export default class ServerPlayer {
    netid: number;
    displayName: string;
    pureName: string;
    ids: string[] = [];
    hwids: string[] = [];
    license: false | string = false; //extracted for convenience

    tsConnected = now();
    isConnected: boolean = true;
    dbData: false | PlayerDbDataType = false;

    constructor(netid: number, playerData: PlayerDataType) {
        this.netid = netid;
        if (
            playerData === null
            || typeof playerData !== 'object'
            || typeof playerData.name !== 'string'
            || !Array.isArray(playerData.ids)
            || !Array.isArray(playerData.hwids)
        ) {
            throw new Error(`invalid player data`);
        }

        //Processing identifiers
        //NOTE: ignoring IP completely
        for (const idString of playerData.ids) {
            const [idType,idValue] = idString.split(':', 2);
            const validator = consts.validIdentifiers[idType as keyof typeof consts.validIdentifiers];
            if (validator && validator.test(idString)) {
                this.ids.push(idString);
                if (idType === 'license') {
                    this.license = idValue;
                }
            }
        }
        //TODO: re-enable it when migrating to new database
        // this.hwids = playerData.hwids.filter(x => {
        //     return typeof x === 'string' && consts.regexValidHwidToken.test(x);
        // });

        //Processing player name
        const { displayName, pureName } = cleanPlayerName(playerData.name);
        this.displayName = displayName;
        this.pureName = pureName;
    }

    disconnect() {
        this.isConnected = false;
    }

    setDbData(dbData: PlayerDbDataType) {
        this.dbData = dbData;
    }
}
