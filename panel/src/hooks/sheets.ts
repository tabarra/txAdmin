import { atom, useAtom, useSetAtom } from 'jotai';


/**
 * Atoms
 */
export const isGlobalMenuSheetOpenAtom = atom(false);
export const isServerSheetOpenAtom = atom(false);
export const isPlayerlistSheetOpenAtom = atom(false);


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

export const useCloseAllSheets = () => {
    const setIsGlobalMenuSheetOpen = useSetAtom(isGlobalMenuSheetOpenAtom);
    const setIsServerSheetOpen = useSetAtom(isServerSheetOpenAtom);
    const setIsPlayerlistSheetOpen = useSetAtom(isPlayerlistSheetOpenAtom);

    return () => {
        setIsGlobalMenuSheetOpen(false);
        setIsServerSheetOpen(false);
        setIsPlayerlistSheetOpen(false);
    }
}
