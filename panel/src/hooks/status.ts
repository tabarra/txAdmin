import { TxConfigState } from "@shared/enums";
import { GlobalStatusType } from "@shared/socketioTypes";
import { atom, useAtomValue, useSetAtom } from "jotai";


/**
 * Atoms
 */
export const globalStatusAtom = atom<GlobalStatusType | null>(null);
export const serverNameAtom = atom((get) => get(globalStatusAtom)?.server.name ?? 'unconfigured');
export const txConfigStateAtom = atom((get) => get(globalStatusAtom)?.configState ?? TxConfigState.Unkown);
export const fxRunnerStateAtom = atom((get) => get(globalStatusAtom)?.runner ?? {
    isIdle: true,
    isChildAlive: false,
});


/**
 * Hooks
 */
export const useSetGlobalStatus = () => {
    return useSetAtom(globalStatusAtom);
};

export const useGlobalStatus = () => {
    return useAtomValue(globalStatusAtom);
}
