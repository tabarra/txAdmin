import { atom, useAtom } from 'jotai';

//FIXME: this should probably be somewhere else
type UpdateDataType = false | {
    version: string;
    isImportant: boolean;
}


/**
 * Atoms
 */
const socketOfflineAtom = atom(false);
const txUpdateDataAtom = atom<UpdateDataType>(false);
const fxUpdateDataAtom = atom<UpdateDataType>(false);


/**
 * Hook
 */
export default function useWarningBar() {
    const [isSocketOffline, setIsSocketOffline] = useAtom(socketOfflineAtom);
    const [txUpdateData, setTxUpdateData] = useAtom(txUpdateDataAtom);
    const [fxUpdateData, setFxUpdateData] = useAtom(fxUpdateDataAtom);

    return {
        isSocketOffline, setIsSocketOffline,
        txUpdateData, setTxUpdateData,
        fxUpdateData, setFxUpdateData,
    };
}
