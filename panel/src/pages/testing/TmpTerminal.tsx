import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Co4fOMDXuIP
 */
export default function TmpTerminal() {
    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <div className="flex flex-row flex-grow overflow-auto">
                <div className="flex flex-col flex-grow p-4 space-y-4" id='sdfsdfsfd'>
                    <div className="flex items-center space-x-2">
                        <svg
                            className=" w-4 h-4 text-green-500"
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
                        <p className="font-mono text-sm">{`> command 3`}</p>
                    </div>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="p-4" variant="ghost">
                            <svg
                                className=" w-6 h-6"
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
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full md:w-1/4 bg-gray-900" side="right">
                        <div className="flex flex-col h-full p-4">
                            <h2 className="text-lg font-semibold mb-4">Favorited Commands</h2>
                            <div className="flex-grow overflow-auto space-y-2">
                                <p className="font-mono text-sm">command 1</p>
                                <p className="font-mono text-sm">command 2</p>
                                <p className="font-mono text-sm">command 3</p>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="flex items-center px-4 py-2 border-t border-gray-700">
                <svg
                    className=" w-4 h-4 text-yellow-500"
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
                    className="flex-grow ml-2 bg-transparent text-white placeholder-white placeholder-opacity-50 focus:ring-0 border-0"
                    placeholder="Type a command..."
                    type="text"
                />
            </div>
        </div>
    )
}
