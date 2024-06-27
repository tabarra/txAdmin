import { GlobalStatusType } from "@shared/socketioTypes";
import { atom, useAtomValue, useSetAtom } from "jotai";


/**
 * Atoms
 */
export const globalStatusAtom = atom<GlobalStatusType | null>(null);
export const serverNameAtom = atom((get) => get(globalStatusAtom)?.server.name ?? 'unconfigured');
export const serverConfigPendingStepAtom = atom((get) => get(globalStatusAtom)?.server.configPendingStep);
export const processInstantiatedAtom = atom((get) => get(globalStatusAtom)?.server.instantiated ?? false);


/**
 * Hooks
 */
export const useSetGlobalStatus = () => {
    return useSetAtom(globalStatusAtom);
};

export const useGlobalStatus = () => {
    return useAtomValue(globalStatusAtom);
}
