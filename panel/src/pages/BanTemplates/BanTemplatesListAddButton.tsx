import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";


type BanTemplatesListAddButtonProps = {
    onClick: () => void;
    disabled: boolean;
}

export default function BanTemplatesListAddButton({ onClick, disabled }: BanTemplatesListAddButtonProps) {
    return (
        <li
            onClick={onClick}
            className={cn(
                "rounded-lg bg-card border px-2 py-3 flex gap-3",
                disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary hover:text-primary-foreground cursor-pointer"
            )}
        >
            <PlusIcon className="size-6" />
            <span>Add New Reason</span>
        </li>
    )
}
