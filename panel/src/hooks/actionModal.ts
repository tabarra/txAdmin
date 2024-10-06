import { setUrlSearchParam } from "@/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from 'jotai/utils';


/**
 * Action Modal (history item) Stuff
 * NOTE: copypasted from playerModal.ts
 */
export const actionModalOpenAtom = atomWithReset(false);
export const actionModalRefAtom = atomWithReset<string | undefined>(undefined);
export const actionModalUrlParam = 'actionModal';

//Helper to set the URL search param
export const setActionModalUrlParam = (ref: string | undefined) => {
    setUrlSearchParam(actionModalUrlParam, ref);
}

//Hook to open the action modal
export const useOpenActionModal = () => {
    const setModalRef = useSetAtom(actionModalRefAtom);
    const setModalOpen = useSetAtom(actionModalOpenAtom);
    return (actionId: string) => {
        setActionModalUrlParam(actionId);
        setModalRef(actionId);
        setModalOpen(true);
    }
};

//Hook to close the action modal
export const useCloseActionModal = () => {
    const setModalOpen = useSetAtom(actionModalOpenAtom);
    return () => {
        setActionModalUrlParam(undefined);
        setModalOpen(false);
    }
};


//General hook for the state of the modal
export const useActionModalStateValue = () => {
    const actionRef = useAtomValue(actionModalRefAtom);
    const [isModalOpen, setIsModalOpen] = useAtom(actionModalOpenAtom);
    return {
        isModalOpen,
        actionRef,
        closeModal: () => {
            setActionModalUrlParam(undefined);
            setIsModalOpen(false);
        },
    }
}
