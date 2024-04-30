import { cn } from "@/lib/utils";
import { BanDurationType } from "@shared/otherTypes";
import { Settings2Icon, XIcon } from "lucide-react";
import { banDurationToString } from "./BanTemplatesPage";


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
        <div className="grow flex items-center justify-items-start gap-2">
            <span className="line-clamp-1">
                {reason}
            </span>
            <div className={cn(
                "bg-black/50 opacity-75 px-2 py-0.5 text-sm rounded shrink-0 uppercase",
                duration === 'permanent' ? 'text-red-500' : 'text-primary'
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
