import consts from '@core/extras/consts';
import { cleanPlayerName } from '@core/extras/shared';

type PlayerDataType = {
    name: string,
    ids: string[],
    hwids: string[],
}

export default class ActivePlayer {
    netid: number;
    displayName: string;
    pureName: string;
    ids: string[] = [];
    // hwids: string[] = [];
    connected: boolean = true;
    license: false | string = false; //extracted for convenience

    constructor(playerId: number, playerData: PlayerDataType) {
        this.netid = playerId;
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
        this.connected = false;
    }
}
