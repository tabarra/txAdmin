import { playerCountAtom } from "@/hooks/playerlist";
import { useAtomValue } from "jotai";
import { UsersIcon } from "lucide-react";


export default function PlayerlistSummary() {
    const playerCount = useAtomValue(playerCountAtom);
    const playerCountFormatted = playerCount.toLocaleString("en-US");

    return (
        <div className="w-full flex justify-between items-center">
            <div className="w-16 h-16 dark:bg-zinc-600/50 bg-zinc-300/75 rounded-full flex items-center justify-center">
                <UsersIcon className="w-10 h-10 dark:text-zinc-400 text-zinc-500 text-opacity-80 stroke-1" />
            </div>
            <div className="flex flex-col items-end">
                <div className="text-4xl font-mono font-extralight">{playerCountFormatted}</div>
                <div className="opacity-80 text-lg font-light tracking-wider">Players</div>
            </div>
        </div>
    );
}
