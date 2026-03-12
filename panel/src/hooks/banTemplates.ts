import { BanTemplatesDataType } from "@shared/otherTypes";
import { atom, useAtomValue, useSetAtom } from "jotai";


/**
 * Atoms
 */
const banTemplatesAtom = atom<BanTemplatesDataType[] | undefined>(undefined);


/**
 * Hooks
 */
export const useSetBanTemplates = () => {
    return useSetAtom(banTemplatesAtom);
};

export const useBanTemplates = () => {
    return useAtomValue(banTemplatesAtom);
};
