import { atom, useAtom, useSetAtom } from 'jotai';

//FIXME: this should probably be moved around
type UpdateDataType = false | {
    version: string;
    isImportant: boolean;
}


/**
 * Atoms
 */
const isGlobalMenuSheetOpenAtom = atom(false);
const isServerSheetOpenAtom = atom(false);
const isPlayerlistSheetOpenAtom = atom(false);

const socketOfflineAtom = atom(false);
const txUpdateDataAtom = atom<UpdateDataType>(false);
const fxUpdateDataAtom = atom<UpdateDataType>(false);


/**
 * Hooks
 */
export const useGlobalMenuSheet = () => {
    const [isSheetOpen, setIsSheetOpen] = useAtom(isGlobalMenuSheetOpenAtom);
    return { isSheetOpen, setIsSheetOpen };
};

export const useServerSheet = () => {
    const [isSheetOpen, setIsSheetOpen] = useAtom(isServerSheetOpenAtom);
    return { isSheetOpen, setIsSheetOpen };
};
export const usePlayerlistSheet = () => {
    const [isSheetOpen, setIsSheetOpen] = useAtom(isPlayerlistSheetOpenAtom);
    return { isSheetOpen, setIsSheetOpen };
};
export const useWarningBarData = () => {
    const [isSocketOffline, setIsSocketOffline] = useAtom(socketOfflineAtom);
    const [txUpdateData, setTxUpdateData] = useAtom(txUpdateDataAtom);
    const [fxUpdateData, setFxUpdateData] = useAtom(fxUpdateDataAtom);

    return {
        isSocketOffline, setIsSocketOffline,
        txUpdateData, setTxUpdateData,
        fxUpdateData, setFxUpdateData,
    };
}


export const useSheets = () => {
    const setIsGlobalMenuSheetOpen = useSetAtom(isGlobalMenuSheetOpenAtom);
    const setIsServerSheetOpen = useSetAtom(isServerSheetOpenAtom);
    const setIsPlayerlistSheetOpen = useSetAtom(isPlayerlistSheetOpenAtom);

    const closeAllSheets = () => {
        setIsGlobalMenuSheetOpen(false);
        setIsServerSheetOpen(false);
        setIsPlayerlistSheetOpen(false);
    }

    return { closeAllSheets }
}
