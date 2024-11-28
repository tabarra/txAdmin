import { PlayerModalPlayerData } from "@shared/playerApiTypes";
import { TooltipProvider } from "@/components/ui/tooltip";
import MultiIdsList from "@/components/MultiIdsList";
import { txToast } from "@/components/TxToaster";
import { useState } from "react";


type PlayerIdsTabProps = {
    player: PlayerModalPlayerData;
    refreshModalData: () => void;
}

export default function PlayerIdsTab({ player, refreshModalData }: PlayerIdsTabProps) {
    // const [ids, setIds] = useState(player?.oldIds ?? []);
    // const [hwids, setHwids] = useState(player?.oldHwids ?? []);
    // const onWipeIds = () => {
    //     //TODO: Implement the wipe IDs logic
    //     // refreshModalData();
    //     console.log('Wiping IDs...');
    //     txToast.success('IDs wiped successfully.');
    //     setIds((player?.oldIds ?? []).filter((id) => id.startsWith('license:')));
    // }
    // const onWipeHwids = () => {
    //     //TODO: Implement the wipe IDs logic
    //     // refreshModalData();
    //     console.log('Wiping IDs...');
    //     txToast.success('HWIDs wiped successfully.');
    //     setHwids([]);
    // }

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
