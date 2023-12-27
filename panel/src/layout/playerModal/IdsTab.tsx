import { txToast } from "@/components/TxToaster";
import { cn } from "@/lib/utils";
import { CopyIcon } from "lucide-react";
import { useState } from "react";

//DEBUG
const exampleData = {
    ids: [],
    hwids: [],
    oldIds: [],
    oldHwids: [],
}

type IdsBlockProps = {
    title: string,
    emptyMessage: string,
    allIds: string[],
    currIds: string[],
    isSmaller?: boolean,
}
function IdsBlock({ title, emptyMessage, allIds, currIds, isSmaller }: IdsBlockProps) {
    const [hasCopiedIds, setHasCopiedIds] = useState(false);
    const displayCurrIds = currIds.sort((a, b) => a.localeCompare(b));
    const displayOldIds = allIds.filter((id) => !currIds.includes(id)).sort((a, b) => a.localeCompare(b));

    const handleCopyIds = () => {
        try {
            //Just to guarantee the correct visual order
            const arrToCopy = [...displayCurrIds, ...displayOldIds];
            navigator.clipboard.writeText(arrToCopy.join('\n'));
            setHasCopiedIds(true);
        } catch (error) {
            txToast.error('Failed to copy to clipboard :(');
        }
    }

    return <div>
        <div className="flex justify-between items-center pb-1">
            <h3 className="text-xl">{title}</h3>
            {hasCopiedIds ? (
                <span className="text-sm text-success-inline">Copied!</span>
            ) : (
                <button onClick={handleCopyIds}>
                    <CopyIcon className="h-4 text-secondary hover:text-primary" />
                </button>
            )}
        </div>
        <p className={cn(
            "font-mono break-all whitespace-pre-wrap border rounded divide-y divide-border/50 text-muted-foreground",
            isSmaller ? "text-xxs leading-5 font-extralight tracking-widest opacity-75" : "text-xs leading-6 tracking-wider"
        )}>
            {displayCurrIds.length === 0 && <span className="block px-1 opacity-50 italic">{emptyMessage}</span>}
            {displayCurrIds.map((id) => (
                <span className="block px-1 font-semibold">{id}</span>
            ))}
            {displayOldIds.map((id) => (
                <span className="block px-1 opacity-50">{id}</span>
            ))}
        </p>
    </div>
}


export default function IdsTab() {
    return <div className="flex flex-col gap-4">
        <IdsBlock
            title="Player Identifiers"
            emptyMessage="This player has no identifiers."
            allIds={exampleData.oldIds}
            currIds={exampleData.ids}
        />
        <IdsBlock
            title="Player Hardware IDs"
            emptyMessage="This player has no hardware IDs."
            allIds={exampleData.oldHwids}
            currIds={exampleData.hwids} isSmaller
        />
    </div>;
}
