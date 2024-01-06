import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PencilIcon, StarIcon, StarOffIcon, XIcon } from "lucide-react";


type SheetProps = {
    isOpen: boolean;
    closeSheet: () => void;
}


function SheetBackdrop({ isOpen, closeSheet }: SheetProps) {
    return (
        <div
            className={cn(
                'absolute inset-0 z-10 md:rounded-t-xl',
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


function SheetCloseButton({ closeSheet }: Omit<SheetProps, 'isOpen'>) {
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


const exampleCommandList = [
    "npm install",
    "npm start",
    "git clone <repository-url>",
    "git add .",
    "git commit -m 'Initial commit'",
    "git push origin master",
    "ls",
    "cd <directory>",
    "mkdir <directory-name>",
    "rm <file>",
    "touch <file>",
    "python script.py",
    "node script.js",
    "docker build -t <image-name> .",
    "docker run -p <port>:<port> <image-name>",
];


function SheetCommand({ cmd, type }: { cmd: string, type: 'history' | 'saved' }) {
    return (
        <div
            onClick={() => { console.log('clicked') }}
            className="px-2 flex justify-between items-center rounded-lg bg-card hover:bg-secondary cursor-pointer group"
        >
            <div className="w-full line-clamp-1 text-sm font-mono text-muted-foreground group-hover:text-primary group-hover:line-clamp-none py-1">
                {cmd}
            </div>
            <div className="min-w-max">
                {type === 'history' ? (
                    <Button size="icon" variant="ghost">
                        <StarIcon className="w-5 h-5" />
                        <span className="sr-only">Remove</span>
                    </Button>
                ) : (<>
                    <Button size="icon" variant="ghost">
                        <PencilIcon className="w-5 h-5" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button size="icon" variant="ghost">
                        <StarOffIcon className="w-5 h-5" />
                        <span className="sr-only">Remove</span>
                    </Button>
                </>)}

            </div>
        </div>
    )
}


function SheetCommand2({ cmd, type }: { cmd: string, type: 'history' | 'saved' }) {
    return (
        <div
            onClick={() => { console.log('clicked') }}
            className="px-2 flex justify-between items-center cursor-pointer group min-h-[1.75rem] relative"
        >
            <span className="w-full line-clamp-1x text-sm font-mono px-1 font-semibold group-hover:line-clamp-none">
                {cmd}
            </span>
            <div className="min-w-max items-center hidden group-hover:flex absolute inset-y-0 right-0 bg-background">
                {type === 'history' ? (
                    <button className="">
                        <StarIcon className="w-4 h-4" />
                        <span className="sr-only">Remove</span>
                    </button>
                ) : (
                    <button className="p-1 hover:brightness-125 hover:scale-125">
                        <StarOffIcon className="w-4 h-4" />
                        <span className="sr-only">Remove</span>
                    </button>
                )}
            </div>
        </div>
    )
}


function SheetContent() {
    return (
        <div className="flex flex-row gap-4">
            <div className="flex flex-col flex-grow gap-2">
                <h2 className="text-xl font-bold">History</h2>
                <div className="space-y-2">
                    {exampleCommandList.map((cmd, index) => (
                        <SheetCommand key={index} cmd={cmd} type='history' />
                    ))}
                </div>
            </div>
            <div className="flex flex-col flex-grow gap-2">
                <h2 className="text-xl font-bold">Saved</h2>
                <p className={cn(
                    "font-mono break-all whitespace-pre-wrap border rounded divide-y divide-border/50 text-muted-foreground",
                    "text-sm leading-6 tracking-wider"
                )}>
                    {exampleCommandList.map((cmd, index) => (
                        <SheetCommand2 key={index} cmd={cmd} type='saved' />
                    ))}
                </p>
            </div>
        </div>
    )
}


export default function LiveConsoleSaveSheet({ isOpen, closeSheet }: SheetProps) {
    return <>
        <SheetBackdrop isOpen={isOpen} closeSheet={closeSheet} />
        <div
            data-state={isOpen ? 'open' : 'closed'}
            className={cn(
                'absolute z-20 inset-y-0 w-full md:max-w-2xl',
                'bg-background px-4 py-6 shadow-lg md:rounded-r-xl border-l',
                'data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
                'transition-all duration-300 ease-in-out',
                isOpen ? 'right-0 opacity-100' : '-right-full opacity-0',
            )}
        >
            <SheetCloseButton closeSheet={closeSheet} />
            <SheetContent />
            {/* <div className="flex flex-col h-full justify-center items-center">
                <p className="text-2xl font-bold">Wow Sheet is open :o</p>
            </div> */}
        </div>
    </>;
}
