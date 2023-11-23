import { atom, useAtom, useSetAtom } from 'jotai';

//FIXME: this should probably be somewhere else
type UpdateDataType = false | {
    version: string;
    isImportant: boolean;
}


/**
 * Atoms
 */
const offlineWarningAtom = atom(false);
const txUpdateDataAtom = atom<UpdateDataType>(false);
const fxUpdateDataAtom = atom<UpdateDataType>(false);


/**
 * Hooks
 */
export default function useWarningBar() {
    const [offlineWarning, setOfflineWarning] = useAtom(offlineWarningAtom);
    const [txUpdateData, setTxUpdateData] = useAtom(txUpdateDataAtom);
    const [fxUpdateData, setFxUpdateData] = useAtom(fxUpdateDataAtom);

    return {
        offlineWarning, setOfflineWarning,
        txUpdateData, setTxUpdateData,
        fxUpdateData, setFxUpdateData,
    };
}

//Marks the socket as offline or online
export const useSetOfflineWarning = () => {
    return useSetAtom(offlineWarningAtom);
}
