import { PlayerlistEventType, PlayerlistPlayerType } from "@shared/socketioTypes";
import { atom, useAtomValue } from "jotai";


/**
 * Atoms
 */
export const playerlistAtom = atom<PlayerlistPlayerType[]>([]);
export const playerCountAtom = atom((get) => get(playerlistAtom).length);

