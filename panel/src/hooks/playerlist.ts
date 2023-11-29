import { PlayerlistEventType, PlayerlistPlayerType } from "@shared/socketioTypes";
import { atom, useAtomValue, useSetAtom } from "jotai";


/**
 * Atoms
 */
export const playerlistAtom = atom<PlayerlistPlayerType[]>([]);
export const playerCountAtom = atom((get) => get(playerlistAtom).length);

//NOTE: In the old UI, we didn't store the mutex separately, but as a prop of players
// export const serverMutexAtom = atom<string | null>(null);


/**
 * Hooks
 */
export const useProcessPlayerlistEvents = () => {
    const setPlayerlist = useSetAtom(playerlistAtom);

    return (events: PlayerlistEventType[]) => {
        //If there is a fullPlayerlist, skip everything before it
        const fullListIndex = events.findIndex(e => e.type === 'fullPlayerlist');
        if (fullListIndex > 0) events = events.slice(fullListIndex);

        //Process events
        for (const event of events) {
            if (event.type === 'fullPlayerlist') {
                setPlayerlist(event.playerlist);
            } else if (event.type === 'playerJoining') {
                setPlayerlist((oldList) => [...oldList, event]);
            } else if (event.type === 'playerDropped') {
                setPlayerlist((oldList) => oldList.filter(p => p.netid !== event.netid));
            } else {
                console.error('Unknown playerlist event type', event);
            }
        }
    }
};

