import { PlayerModalPlayerData } from "@shared/playerApiTypes";
import { TooltipProvider } from "@/components/ui/tooltip";
import MultiIdsList from "@/components/MultiIdsList";


type PlayerIdsTabProps = {
    player: PlayerModalPlayerData;
    refreshModalData: () => void;
}

export default function PlayerIdsTab({ player, refreshModalData }: PlayerIdsTabProps) {
    const onWipeIds = () => {
        //TODO: Implement the wipe IDs logic
        refreshModalData();
    }

    return <TooltipProvider>
        <div className="flex flex-col gap-4 p-1">
            <MultiIdsList
                type='id'
                src='player'
                list={player?.oldIds ?? []}
                highlighted={player.ids}
            // onWipeIds={onWipeIds}
            />
            <MultiIdsList
                type='hwid'
                src='player'
                list={player?.oldHwids ?? []}
                highlighted={player.hwids}
            // onWipeIds={onWipeIds}
            />
        </div>
    </TooltipProvider>;
}
