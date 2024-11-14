import { txToast } from "@/components/TxToaster";
import { cn, copyToClipboard } from "@/lib/utils";
import { PlayerModalPlayerData } from "@shared/playerApiTypes";
import { CopyIcon } from "lucide-react";
import { useRef, useState } from "react";


type IdsBlockProps = {
    title: string,
    emptyMessage: string,
    currIds: string[],
    allIds: string[],
    isSmaller?: boolean,
}
function IdsBlock({ title, emptyMessage, currIds, allIds, isSmaller }: IdsBlockProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const [hasCopiedIds, setHasCopiedIds] = useState(false);
    const displayCurrIds = currIds.sort((a, b) => a.localeCompare(b));
    const displayOldIds = allIds.filter((id) => !currIds.includes(id)).sort((a, b) => a.localeCompare(b));
    const hasIdsAvailable = displayCurrIds.length || displayOldIds.length;

    const handleCopyIds = () => {
        if (!divRef.current) throw new Error(`divRef.current undefined`);

        //Just to guarantee the correct visual order
        const strToCopy = [...displayCurrIds, ...displayOldIds].join('\r\n');

        //Copy the ids to the clipboard
        copyToClipboard(strToCopy, divRef.current).then((res) => {
            if (res !== false) {
                setHasCopiedIds(true);
            } else {
                txToast.error('Failed to copy to clipboard :(');
            }
        }).catch((error) => {
            txToast.error({
                title: 'Failed to copy to clipboard:',
                msg: error.message,
            });
        });
    }

    return <div>
        <div className="flex justify-between items-center pb-1" ref={divRef}>
            <h3 className="text-xl">{title}</h3>
            {hasCopiedIds ? (
                <span className="text-sm text-success-inline">Copied!</span>
            ) : (
                // TODO: a button to erase the ids from the database can be added here,
                // requires tooltip and confirm modal though
                // <button onClick={handleWipeIds} className={cn(!hasIdsAvailable && 'hidden')}>
                //     <Trash2Icon className="h-4 text-secondary hover:text-destructive" />
                // </button>
                <button onClick={handleCopyIds} className={cn(!hasIdsAvailable && 'hidden')}>
                    <CopyIcon className="h-4 text-secondary hover:text-primary" />
                </button>
            )}
        </div>
        <p className={cn(
            "font-mono break-all whitespace-pre-wrap border rounded divide-y divide-border/50 text-muted-foreground",
            hasIdsAvailable && isSmaller ? "text-2xs leading-5 font-extralight tracking-widest" : "text-xs leading-6 tracking-wider"
        )}>
            {!hasIdsAvailable && <span className="block px-1 opacity-50 italic">{emptyMessage}</span>}
            {displayCurrIds.map((id) => (
                <span key={id} className="block px-1 font-semibold">{id}</span>
            ))}
            {displayOldIds.map((id) => (
                <span key={id} className="block px-1 opacity-50">{id}</span>
            ))}
        </p>
    </div>
}


export default function PlayerIdsTab({ player }: { player: PlayerModalPlayerData }) {
    return <div className="flex flex-col gap-4 p-1">
        <IdsBlock
            title="Player Identifiers"
            emptyMessage="This player has no identifiers."
            currIds={player.ids}
            allIds={player?.oldIds ?? []}
        />
        <IdsBlock
            title="Player Hardware IDs"
            emptyMessage="This player has no hardware IDs."
            currIds={player.hwids}
            allIds={player?.oldHwids ?? []}
            isSmaller
        />
    </div>;
}
