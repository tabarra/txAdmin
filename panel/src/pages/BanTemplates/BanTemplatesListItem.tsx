import { banDurationToString, cn } from "@/lib/utils";
import { BanDurationType } from "@shared/otherTypes";
import { Settings2Icon, XIcon } from "lucide-react";


type BanTemplatesListItemProps = {
    id: string;
    reason: string;
    duration: BanDurationType;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    disabled: boolean;
}

export default function BanTemplatesListItem({ id, reason, duration, onEdit, onRemove, disabled }: BanTemplatesListItemProps) {
    return (<>
        <div className="grow sm:flex items-center justify-items-start gap-2">
            <span className="line-clamp-5 md:line-clamp-3">
                {reason}
            </span>
            <div className={cn(
                "bg-black/5 dark:bg-black/40 px-2 py-0.5 my-1 sm:my-0 border text-sm rounded w-max shrink-0 uppercase select-none",
                duration === 'permanent'
                    ? 'border-destructive bg-destructive-hint text-destructive'
                    : 'border-primary text-primary opacity-85'
            )}>
                {banDurationToString(duration)}
            </div>
        </div>
        <div className="flex gap-2">
            <button
                className={cn(
                    "text-muted-foreground",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:text-primary hover:scale-110"
                )}
                onClick={() => onEdit(id)}
                disabled={disabled}
            >
                <Settings2Icon className="size-6" />
            </button>
            <button
                className={cn(
                    "text-muted-foreground",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:text-destructive hover:scale-110"
                )}
                onClick={() => onRemove(id)}
                disabled={disabled}
            >
                <XIcon className="size-6" />
            </button>
        </div>
    </>)
}
