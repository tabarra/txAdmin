import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BookMarkedIcon, FileDownIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";


type TerminalSheetProps = {
    isOpen: boolean;
    closeSheet: () => void;
}

function TerminalSheetBackdrop({ isOpen, closeSheet }: TerminalSheetProps) {
    return (
        <div
            className={cn(
                'absolute inset-0 z-10 md:rounded-xl',
                'bg-black/40 duration-300',
                'data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
                'data-[state=open]:opacity-100 data-[state=open]:backdrop-blur-sm',
                'data-[state=closed]:opacity-0 data-[state=closed]:backdrop-blur-none',
            )}
            data-state={isOpen ? 'open' : 'closed'}
            onClick={closeSheet}
        />
    )
}

function TerminalSheetCloseButton({ closeSheet }: Omit<TerminalSheetProps, 'isOpen'>) {
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

function TerminalSheet({ isOpen, closeSheet }: TerminalSheetProps) {
    return <>
        <TerminalSheetBackdrop isOpen={isOpen} closeSheet={closeSheet} />
        <div
            data-state={isOpen ? 'open' : 'closed'}
            className={cn(
                'absolute z-20 inset-y-0 w-full sm:max-w-xl',
                'bg-background p-4 shadow-lg md:rounded-r-xl border-l',
                'data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
                'transition-all duration-300 ease-in-out',
                isOpen ? 'right-0 opacity-100' : '-right-full opacity-0',
            )}
        >
            <TerminalSheetCloseButton closeSheet={closeSheet} />
            <div className="flex flex-col h-full justify-center items-center">
                <p className="text-2xl font-bold">Wow Sheet is open :o</p>
            </div>
        </div>
    </>;
}


type TerminalFooterButtonProps = {
    icon: React.ElementType;
    title: string;
    onClick: () => void;
}

function TerminalFooterButton({ icon: Icon, title, onClick }: TerminalFooterButtonProps) {
    return (
        <div
            className="group bg-secondary xs:bg-transparent 2xl:hover:bg-secondary w-full rounded-lg px-1.5 py-2 cursor-pointer flex items-center justify-center"
            onClick={onClick}
        >
            <Icon className="w-6 h-6 2xl:w-5 2xl:h-5 text-muted-foreground group-hover:scale-110 group-hover:text-secondary-foreground inline" />
            <span className="hidden 2xl:inline ml-1 align-middle">
                {title}
            </span>
        </div>
    )
}


export default function TmpTerminal() {
    const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);

    const toggleSaveSheet = () => {
        setIsSaveSheetOpen(!isSaveSheetOpen);
    }

    return (
        <div className="dark text-primary flex flex-col h-full bg-card border md:rounded-xl overflow-clip">
            <div className="flex flex-row flex-grow relative">
                <TerminalSheet isOpen={isSaveSheetOpen} closeSheet={() => setIsSaveSheetOpen(false)} />

                <div className="flex flex-col flex-grow p-4 space-y-4" id='sdfsdfsfd'>
                    <div className="flex items-center space-x-2">
                        <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            height="24"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <polyline points="4 17 10 11 4 5" />
                            <line x1="12" x2="20" y1="19" y2="19" />
                        </svg>
                        <p className="font-mono text-sm">Terminal</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <p className="font-mono text-sm">{`> command 1`}</p>
                        <p className="font-mono text-sm">{`> command 2`}</p>
                        <p className="font-mono text-sm">{`> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`}</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 px-1 sm:px-4 py-2 border-t justify-center">
                <div className="flex items-center grow">
                    <svg
                        className="hidden sm:block w-4 h-4 mr-2 text-warning-inline shrink-0"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                    <Input
                        id="terminal-input"
                        className="w-full"
                        placeholder="Type a command..."
                        type="text"
                    />
                </div>
                <div className="flex flex-row justify-evenly gap-3 2xl:gap-1 select-none">
                    <TerminalFooterButton icon={BookMarkedIcon} title="Saved" onClick={toggleSaveSheet} />
                    <TerminalFooterButton icon={SearchIcon} title="Search" onClick={() => { }} />
                    <TerminalFooterButton icon={Trash2Icon} title="Clear" onClick={() => { }} />
                    <TerminalFooterButton icon={FileDownIcon} title="Download" onClick={() => { }} />
                </div>
            </div>
        </div>
    )
}
