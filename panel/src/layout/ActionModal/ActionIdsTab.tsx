import { txToast } from "@/components/TxToaster";
import { cn, copyToClipboard } from "@/lib/utils";
import { CopyIcon } from "lucide-react";
import { useState } from "react";
import { DatabaseActionType } from "../../../../core/components/PlayerDatabase/databaseTypes";


type IdsBlockProps = {
    title: string,
    emptyMessage: string,
    ids: string[] | undefined,
    isSmaller?: boolean,
}
function IdsBlock({ title, emptyMessage, ids, isSmaller }: IdsBlockProps) {
    const [hasCopiedIds, setHasCopiedIds] = useState(false);

    const handleCopyIds = () => {
        if (!ids) return;
        copyToClipboard(ids.join('\n')).then((res) => {
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
    const hasIdsAvailable = Array.isArray(ids) && ids.length;

    return <div className="px-1 mb-1 md:mb-4">
        <div className="flex justify-between items-center pb-1">
            <h3 className="text-xl">{title}</h3>
            {/* {hasCopiedIds ? (
                <span className="text-sm text-success-inline">Copied!</span>
            ) : (
                // TODO: a button to erase the ids from the database can be added here,
                // requires tooltip and confirm modal though
                <button onClick={handleCopyIds}>
                    <CopyIcon className="h-4 text-secondary hover:text-primary" />
                </button>
            )} */}
        </div>
        <p className={cn(
            "font-mono break-all whitespace-pre-wrap border rounded divide-y divide-border/50 text-muted-foreground",
            hasIdsAvailable && isSmaller ? "text-2xs leading-5 font-extralight tracking-widest" : "text-xs leading-6 tracking-wider"
        )}>
            {hasIdsAvailable ? ids.map((id) => (
                <span key={id} className="block px-1 font-semibold">{id}</span>
            )) : (
                <span className="block px-1 opacity-50 italic">{emptyMessage}</span>
            )}
        </p>
    </div>
}


export default function ActionIdsTab({ action }: { action: DatabaseActionType }) {
    return <div className="flex flex-col gap-4 p-1">
        <IdsBlock
            title="Target Identifiers"
            emptyMessage="This action targets no identifiers."
            ids={action.ids}
        />
        <IdsBlock
            title="Target Hardware IDs"
            emptyMessage="This action targets no hardware IDs."
            ids={action.hwids}
            isSmaller
        />
    </div>;
}
