import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from 'jotai/utils';
import { ReactElement } from "react";


/**
 * Account Modal Stuff
 */
export const accountModalOpenAtom = atom(false);
const accountModalTabAtom = atom<undefined | string>(undefined);

export const useAccountModal = () => {
    const [isAccountModalOpen, setAccountModalOpen] = useAtom(accountModalOpenAtom);
    const [accountModalTab, setAccountModalTab] = useAtom(accountModalTabAtom);
    return {
        isAccountModalOpen,
        setAccountModalOpen,
        accountModalTab,
        setAccountModalTab,
    }
}

export const useOpenAccountModal = () => {
    const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
    const setAccountModalTab = useSetAtom(accountModalTabAtom);
    return (tab?: string) => {
        setAccountModalOpen(true);
        if (tab) setAccountModalTab(tab);
    }
}

export const useCloseAccountModal = () => {
    const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
    return () => {
        setAccountModalOpen(false);
    }
}


/**
 * Confirm Dialog Stuff
 */
type ConfirmDialogType = {
    title: string;
    message?: ReactElement | string;
    cancelLabel?: string;
    actionLabel?: string;
    confirmBtnVariant?: VariantProps<typeof buttonVariants>['variant'];
    onConfirm: () => void;
    onCancel?: () => void;
}

export const confirmDialogOpenAtom = atom(false);
const confirmDialogDataAtom = atomWithReset<ConfirmDialogType>({
    title: '',
    onConfirm: () => { },
});

//Hook to open the dialog
export const useOpenConfirmDialog = () => {
    const setDialogOpen = useSetAtom(confirmDialogOpenAtom);
    const setDialogData = useSetAtom(confirmDialogDataAtom);
    return (data: ConfirmDialogType) => {
        setDialogData(data);
        setDialogOpen(true);
    }
};

//Hook to close the dialog
export const useCloseConfirmDialog = () => {
    const setDialogOpen = useSetAtom(confirmDialogOpenAtom);
    return () => {
        setDialogOpen(false);
    }
}

//Data used by the component itself
export const useConfirmDialogState = () => {
    const isOpen = useAtomValue(confirmDialogOpenAtom);
    const dialogData = useAtomValue(confirmDialogDataAtom);
    return {
        isOpen,
        ...dialogData,
    }
}


/**
 * Prompt Dialog Stuff
 */
type PromptDialogType = {
    title: string;
    message?: ReactElement | string;
    placeholder?: string;
    required?: boolean;
    suggestions?: string[];
    isWide?: boolean;
    cancelLabel?: string;
    submitLabel?: string;
    submitBtnVariant?: VariantProps<typeof buttonVariants>['variant'];
    onSubmit: (input: string) => void;
    onCancel?: () => void;
}
export const promptDialogOpenAtom = atom(false);
const promptDialogDataAtom = atomWithReset<PromptDialogType>({
    title: '',
    onSubmit: () => { },
});

//Hook to open the dialog
export const useOpenPromptDialog = () => {
    const setDialogOpen = useSetAtom(promptDialogOpenAtom);
    const setDialogData = useSetAtom(promptDialogDataAtom);
    return (data: PromptDialogType) => {
        setDialogData(data);
        setDialogOpen(true);
    }
};

//Hook to close the dialog
export const useClosePromptDialog = () => {
    const setDialogOpen = useSetAtom(promptDialogOpenAtom);
    return () => {
        setDialogOpen(false);
    }
}

//Data used by the component itself
export const usePromptDialogState = () => {
    const isOpen = useAtomValue(promptDialogOpenAtom);
    const dialogData = useAtomValue(promptDialogDataAtom);
    return {
        isOpen,
        ...dialogData,
    }
}
