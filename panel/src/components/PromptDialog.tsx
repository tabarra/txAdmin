import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClosePromptDialog, usePromptDialogState } from "@/hooks/dialogs";
import { useRef } from "react";
import { cn } from "@/lib/utils";


export default function PromptDialog() {
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogState = usePromptDialogState();
    const closeDialog = useClosePromptDialog();

    const handleSubmit = () => {
        if (!dialogState.isOpen) return;
        closeDialog();
        const input = inputRef.current?.value ?? '';
        dialogState.onSubmit(input.trim());
    }

    const handleForm = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSubmit();
    }

    const handleOpenClose = (newOpenState: boolean) => {
        if (!dialogState.isOpen) return;
        if (!newOpenState) {
            closeDialog();
            if (dialogState.onCancel) {
                dialogState.onCancel();
            }
        }
    }

    return (
        <Dialog open={dialogState.isOpen} onOpenChange={handleOpenClose}>
            <DialogContent className={cn(dialogState.isWide && "md:max-w-2xl")}>
                <form onSubmit={handleForm} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>{dialogState.title}</DialogTitle>
                        <DialogDescription>
                            {dialogState.message}
                        </DialogDescription>
                    </DialogHeader>

                    <Input
                        autoFocus
                        id="userInput"
                        ref={inputRef}
                        placeholder={dialogState.placeholder}
                        autoComplete="off"
                        required={dialogState.required}
                    />
                    <DialogFooter className="gap-2 flex-col">
                        <div className="flex flex-col sm:flex-row sm:justify-start gap-2 w-full flex-wrap">
                            {dialogState.suggestions && dialogState.suggestions.map((suggestion, index) => (
                                <Button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        inputRef.current!.value = suggestion;
                                        handleSubmit();
                                    }}
                                    variant="outline"
                                >
                                    <span className="sm:hidden mr-auto text-muted-foreground">Suggestion:</span>
                                    {suggestion}
                                </Button>
                            ))}
                        </div>
                        <Button
                            type="submit"
                            variant={dialogState.submitBtnVariant ?? 'default'}
                        >
                            {dialogState.submitLabel ?? 'Submit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
