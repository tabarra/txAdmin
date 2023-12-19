import { playerCountAtom } from "@/hooks/playerlist";
import { useAtomValue } from "jotai";

export default function PlayerlistSummary() {
    const playerCount = useAtomValue(playerCountAtom);

    return (
        <div
            className="flex justify-center items-center h-[211px]
            text-3xl font-extralight text-center tracking-wider"
        >
            PLAYERS: {playerCount}
        </div>
    );
}
