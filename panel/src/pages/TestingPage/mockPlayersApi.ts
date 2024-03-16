import { faker } from '@faker-js/faker'
import { PlayersTableReqType } from '@shared/playerApiTypes';

export type PlayerType = {
    license: string;
    displayName: string;
    playTime: number;
    tsJoined: number;
    tsLastConnection: number;
    notes?: string;
}

export type PlayersApiResp = {
    players: PlayerType[];
    hasReachedEnd: boolean;
    dbPlayerCount: number;
}

let personCounter = 0;
const newPerson = (isNew?: boolean): PlayerType => {
    personCounter++;
    return {
        license: faker.string.uuid(),
        // displayName: (personCounter).toString().padStart(3, '_'),
        // displayName: `${personCounter} ${faker.person.firstName()} ${faker.animal.type()}`,
        displayName: `${faker.person.firstName()} ${faker.animal.type()}`,
        playTime: faker.number.int(1500),
        tsJoined: !isNew ? faker.date.recent({ days: 30 }).getTime() : Math.floor(Date.now() / 1000),
        tsLastConnection: faker.date.recent({ days: 5 }).getTime(),
        notes: Math.random() < 0.1 ? faker.lorem.sentence() : undefined,
    }
}

const initialSize = 100;
const dbData: PlayerType[] = [];
for (let i = 0; i < initialSize; i++) {
    dbData.push(newPerson());
}
dbData.sort((a, b) => a.tsJoined - b.tsJoined);


// setInterval(() => {
//     dbData.push(newPerson(true));
//     console.log('added person', dbData.length);
// }, 1000);



const limit = 40;
//simulates a backend api
export const mockBackendApi = async ({
    search, filters, sorting, offset
}: PlayersTableReqType): Promise<PlayersApiResp> => {
    let dbCopy = [...dbData];

    //search
    if (search) {
        const searchVal = search.value.toLocaleLowerCase();
        let filterFunc; //playerName, playerNotes, playerIds
        if (search.type === 'playerName') {
            filterFunc = (player: PlayerType) => player.displayName.toLocaleLowerCase().includes(searchVal)
        } else if (search.type === 'playerNotes') {
            filterFunc = (player: PlayerType) => player.notes && player.notes.toLocaleLowerCase().includes(searchVal)
        } else if (search.type === 'playerIds') {
            filterFunc = (player: PlayerType) => player.license.toLocaleLowerCase().includes(searchVal)
        } else {
            throw new Error('Invalid search type');
        }

        dbCopy = dbCopy.filter(filterFunc);
    }

    //filters
    //FIXME: implement filters

    //sorting
    dbCopy.sort((a, b) => {
        if (sorting.desc) {
            return b[sorting.key] - a[sorting.key]
        } else {
            return a[sorting.key] - b[sorting.key]
        }
    });

    //offset
    let startIndex = 0;
    if (offset) {
        const refIndex = dbCopy.findIndex(player => {
            return player.license !== offset.license && sorting.desc
                ? player[sorting.key] <= offset.param
                : player[sorting.key] >= offset.param
        });
        if (refIndex === -1) {
            return {
                players: [],
                hasReachedEnd: true,
                dbPlayerCount: dbCopy.length,
            }
        }
        startIndex = refIndex + 1;
    }
    const endIndex = startIndex + limit;


    // await new Promise(resolve => setTimeout(resolve, 1250));
    await new Promise(resolve => setTimeout(resolve, 250));
    return {
        players: dbCopy.slice(startIndex, endIndex),
        hasReachedEnd: endIndex >= dbCopy.length,
        dbPlayerCount: dbCopy.length,
    };
}
