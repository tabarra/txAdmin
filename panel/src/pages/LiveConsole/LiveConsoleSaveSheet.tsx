import { txToast } from "@/components/TxToaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOpenPromptDialog } from "@/hooks/dialogs";
import { useLiveConsoleBookmarks, useLiveConsoleHistory } from "@/hooks/liveConsole";
import { cn } from "@/lib/utils";
import { PlusIcon, StarIcon, StarOffIcon, XIcon } from "lucide-react";


type SheetProps = {
    isOpen: boolean;
    closeSheet: () => void;
    toTermInput: (_cmd: string) => void;
}

function SheetBackdrop({ isOpen, closeSheet }: Omit<SheetProps, 'toTermInput'>) {
    return (
        <div
            className={cn(
                'absolute inset-0 z-20',
                'bg-black/60 duration-300',
                'data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
                'data-[state=open]:opacity-100',
                'data-[state=closed]:opacity-0',
            )}
            data-state={isOpen ? 'open' : 'closed'}
            onClick={closeSheet}
        />
    )
}


function SheetCloseButton({ closeSheet }: Pick<SheetProps, 'closeSheet'>) {
    return (
        <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-0 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer"
            onClick={closeSheet}
            title="Close"
        >
            <XIcon className="h-8 w-8" />
        </button>
    )
}


type SheetCommandProps = {
    cmd: string;
    type: 'history' | 'saved';
    onClick: () => void;
    onFavAction: () => void;
}

function SheetCommand({ cmd, type, onClick, onFavAction }: SheetCommandProps) {
    const handleFavAction = (event: React.MouseEvent) => {
        event.stopPropagation();
        onFavAction();
    };

    return (
        <div
            onClick={onClick}
            className="px-2 py-1 flex justify-between items-center rounded-lg bg-card hover:bg-muted cursor-pointer group"
        >
            <span className="py-1 line-clamp-4 font-mono group-hover:text-primary">
                {cmd}
            </span>
            <div className="min-w-max">
                <button
                    className="size-7 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground invisible group-hover:visible"
                    onClick={handleFavAction}
                >
                    {type === 'history' ? (<>
                        <StarIcon className="size-5" />
                        <span className="sr-only">Save</span>
                    </>) : (<>
                        <StarOffIcon className="size-5" />
                        <span className="sr-only">Remove</span>
                    </>)}
                </button>
            </div>
        </div >
    )
}


function SheetContent({ toTermInput }: Pick<SheetProps, 'toTermInput'>) {
    const { history, wipeHistory } = useLiveConsoleHistory();
    const { bookmarks, addBookmark, removeBookmark } = useLiveConsoleBookmarks();
    const openPromptDialog = useOpenPromptDialog();

    const handleWipeHistory = () => {
        txToast.success('History cleared');
        wipeHistory();
    }
    const handleSaveCommand = () => {
        openPromptDialog({
            title: 'Save Command',
            message: 'Enter the command to save:',
            submitLabel: 'Save',
            onSubmit: (cmd) => {
                if (cmd) addBookmark(cmd);
            }
        })
    }
    return (
        <div className="flex flex-row gap-4 max-h-full">
            <div className="flex flex-col flex-grow gap-2 w-1/2">
                <h2 className="text-xl font-bold">History</h2>
                <ScrollArea className="max-h-full w-full pr-3 text-sm text-muted-foreground" style={{ wordBreak: 'break-word' }}>
                    <button
                        onClick={handleWipeHistory}
                        className="w-full py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground font-sans tracking-wider mb-2"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <XIcon className="w-4 h-4 inline" />
                            Clear History
                        </div>
                    </button>
                    <div className="space-y-2 line-clamp-1 text-sm font-mono tracking-wide  pb-4">
                        {history.map((cmd, index) => (
                            <SheetCommand
                                key={index}
                                cmd={cmd}
                                type='history'
                                onClick={() => toTermInput(cmd)}
                                onFavAction={() => addBookmark(cmd)}
                            />
                        ))}
                    </div>
                    {history.length === 0 && (
                        <div className="w-full h-auto text-center italic tracking-wider">
                            The command history is empty.
                        </div>
                    )}
                </ScrollArea>
            </div>
            <div className="flex flex-col flex-grow gap-2 w-1/2">
                <h2 className="text-xl font-bold">Saved</h2>
                <ScrollArea className="max-h-full w-full pr-3 text-sm text-muted-foreground" style={{ wordBreak: 'break-word' }}>
                    <button
                        onClick={handleSaveCommand}
                        className="w-full py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground font-sans tracking-wider mb-2"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <PlusIcon className="w-4 h-4 inline" />
                            Add New
                        </div>
                    </button>
                    <div className="space-y-2 line-clamp-1 text-sm font-mono tracking-wide  pb-4">
                        {bookmarks.map((cmd, index) => (
                            <SheetCommand
                                key={index}
                                cmd={cmd}
                                type='saved'
                                onClick={() => toTermInput(cmd)}
                                onFavAction={() => removeBookmark(cmd)}
                            />
                        ))}
                    </div>
                    {bookmarks.length === 0 && (
                        <div className="w-full h-auto text-center italic tracking-wider">
                            There are no saved commands. <br />
                            To save a command, click the star icon next to it.
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}


export default function LiveConsoleSaveSheet({ isOpen, closeSheet, toTermInput }: SheetProps) {
    return <>
        <SheetBackdrop isOpen={isOpen} closeSheet={closeSheet} />
        <div
            data-state={isOpen ? 'open' : 'closed'}
            className={cn(
                'absolute z-20 inset-y-0 w-full md:max-w-2xl',
                'bg-background px-4 pt-6 shadow-lg border-l',
                'data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
                'transition-all duration-300 ease-in-out',
                isOpen ? 'right-0 opacity-100' : '-right-full opacity-0',
            )}
        >
            <SheetCloseButton closeSheet={closeSheet} />
            <SheetContent toTermInput={toTermInput} />
        </div>
    </>;
}
