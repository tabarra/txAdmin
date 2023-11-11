import { atom, useAtom, useSetAtom } from 'jotai';


/**
 * Atom
 */
const isGlobalMenuSheetOpen = atom(false);
const isServerSheetOpen = atom(false);
const isPlayerlistSheetOpen = atom(false);


/**
 * Hook
 */
export const useGlobalMenuSheet = () => {
    const [isSheetOpen, setIsSheetOpen] = useAtom(isGlobalMenuSheetOpen);
    return { isSheetOpen, setIsSheetOpen };
};

export const useServerSheet = () => {
    const [isSheetOpen, setIsSheetOpen] = useAtom(isServerSheetOpen);
    return { isSheetOpen, setIsSheetOpen };
};
export const usePlayerlistSheet = () => {
    const [isSheetOpen, setIsSheetOpen] = useAtom(isPlayerlistSheetOpen);
    return { isSheetOpen, setIsSheetOpen };
};


export const useSheets = () => {
    const setIsGlobalMenuSheetOpen = useSetAtom(isGlobalMenuSheetOpen);
    const setIsServerSheetOpen = useSetAtom(isServerSheetOpen);
    const setIsPlayerlistSheetOpen = useSetAtom(isPlayerlistSheetOpen);

    const closeAllSheets = () => {
        setIsGlobalMenuSheetOpen(false);
        setIsServerSheetOpen(false);
        setIsPlayerlistSheetOpen(false);
    }

    return { closeAllSheets }
}
