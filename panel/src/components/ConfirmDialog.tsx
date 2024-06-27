import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCloseConfirmDialog, useConfirmDialogState } from "@/hooks/dialogs";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { buttonVariants } from "./ui/button";
import { useOnClickOutside } from "usehooks-ts";


export default function ConfirmDialog() {
    const modalRef = useRef(null);
    const dialogState = useConfirmDialogState();
    const closeDialog = useCloseConfirmDialog();

    const handleCancel = () => {
        if (!dialogState.isOpen) return;
        closeDialog();
        if (dialogState.onCancel) {
            dialogState.onCancel();
        }
    }

    const handleConfirm = () => {
        if (!dialogState.isOpen) return;
        closeDialog();
        dialogState.onConfirm();
    }

    const handleConfirmKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (e.key === 'Enter' || e.key === 'NumpadEnter') {
            handleConfirm();
        } else if(e.key === 'Backspace' || e.key === 'Escape'){
            handleCancel();
        }
    }

    const handleOpenClose = (newOpenState: boolean) => {
        if (!newOpenState) {
            handleCancel();
        }
    }

    useOnClickOutside(modalRef, handleCancel);

    return (
        <AlertDialog open={dialogState.isOpen} onOpenChange={handleOpenClose}>
            <AlertDialogContent ref={modalRef}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogState.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {dialogState.cancelLabel ?? 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        autoFocus
                        onKeyDown={handleConfirmKeyDown}
                        onClick={handleConfirm}
                        className={cn(buttonVariants({ variant: dialogState.confirmBtnVariant ?? 'destructive' }))}
                    >
                        {dialogState.actionLabel ?? 'Continue'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
