import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PlusIcon, StarIcon, StarOffIcon, XIcon } from "lucide-react";


type SheetProps = {
    isOpen: boolean;
    closeSheet: () => void;
}

function SheetBackdrop({ isOpen, closeSheet }: SheetProps) {
    return (
        <div
            className={cn(
                'absolute inset-0 z-20 md:rounded-t-xl',
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
    "docker-compose up -d",
    "grep 'pattern' <file>",
    "terraform apply -var-file=vars.tfvars",
    "date",
    "chmod +x <file>",
    "git pull origin master && npm install && npm run build",
    "mv <source> <destination>",
    "open <file>",
    "docker build -t <image-name> .",
    "start <file>",
    "npm install",
    "git clone <repository-url>",
    "docker run -p <port>:<port> <image-name>",
    "clear",
    "git add .",
    "node script.js",
    "cd <directory>",
    "rm <file>",
    "git push origin master",
    "echo 'Hello, World!'",
    "mkdir <directory-name>",
    "traceroute <host>",
    "python script.py",
    "npm start",
    "mvn clean install -DskipTests",
    "ssh user@example.com",
    "java -jar myapp.jar --config=config.properties",
    "kubectl create deployment my-deployment --image=my-image:latest --replicas=3 --port=8080",
    "curl https://api.example.com",
    "npm run build && npm run deploy",
    "whoami",
    "ping <host>",
    "cat <file>",
    "ls",
    "shutdown",
    "sudo apt-get install <package>",
    "touch <file>",
    "git commit -m 'Initial commit'",
];


function SheetCommand({ cmd, type }: { cmd: string, type: 'history' | 'saved' }) {
    return (
        <div
            onClick={() => { console.log('clicked') }}
            className="px-2 py-1 flex justify-between items-center rounded-lg bg-card hover:bg-muted cursor-pointer group"
        >
            <span className="py-1 line-clamp-1 break-all text-sm font-mono tracking-wide text-muted-foreground group-hover:text-primary group-hover:line-clamp-none group-hover:break-normal">
                {cmd}
            </span>
            <div className="min-w-max">
                {type === 'history' ? (
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground invisible group-hover:visible">
                        <StarIcon className="w-5 h-5" />
                        <span className="sr-only">Save</span>
                    </button>
                ) : (<>
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground invisible group-hover:visible">
                        <StarOffIcon className="w-5 h-5" />
                        <span className="sr-only">Remove</span>
                    </button>
                </>)}
            </div>
        </div>
    )
}


function SheetContent() {
    return (
        <div className="flex flex-row gap-4 max-h-full">
            <div className="flex flex-col flex-grow gap-2">
                <h2 className="text-xl font-bold">History</h2>
                <ScrollArea className="max-h-full w-full pr-3">
                    <div className="space-y-2 line-clamp-1 break-all text-sm font-mono tracking-wide text-muted-foreground pb-4">
                        <button
                            onClick={() => { console.log('clicked') }}
                            className="w-full py-2 rounded-lg bg-card hover:bg-primary hover:text-primary-foreground font-sans tracking-wider"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <XIcon className="w-4 h-4 inline" />
                                Clear History
                            </div>
                        </button>
                        {exampleCommandList.map((cmd, index) => (
                            <SheetCommand key={index} cmd={cmd} type='history' />
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <div className="flex flex-col flex-grow gap-2">
                <h2 className="text-xl font-bold">Saved</h2>
                <ScrollArea className="max-h-full w-full pr-3">
                    <div className="space-y-2 line-clamp-1 break-all text-sm font-mono tracking-wide text-muted-foreground pb-4">
                        <button
                            onClick={() => { console.log('clicked') }}
                            className="w-full py-2 rounded-lg bg-card hover:bg-primary hover:text-primary-foreground font-sans tracking-wider"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <PlusIcon className="w-4 h-4 inline" />
                                Add New
                            </div>
                        </button>
                        {exampleCommandList.map((cmd, index) => (
                            <SheetCommand key={index} cmd={cmd} type='saved' />
                        ))}
                    </div>
                </ScrollArea>
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
                'bg-background px-4 pt-6 shadow-lg border-l',
                'data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
                'transition-all duration-300 ease-in-out',
                isOpen ? 'right-0 opacity-100' : '-right-full opacity-0',
            )}
        >
            <SheetCloseButton closeSheet={closeSheet} />
            <SheetContent />
        </div>
    </>;
}
