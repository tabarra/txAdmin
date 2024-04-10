import InlineCode from "@/components/InlineCode";
import { useAdminPerms } from "@/hooks/auth";
import { useOpenConfirmDialog } from "@/hooks/dialogs";
import { cn } from "@/lib/utils";
import { GripVerticalIcon, PenSquareIcon, PlusIcon, Settings2Icon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

type PresetListItemProps = {
    id: string;
    reason: string;
    duration: string;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    disabled: boolean;
}

function PresetListItem({ id, reason, duration, onEdit, onRemove, disabled }: PresetListItemProps) {
    return (
        <li className="bg-card rounded-lg border px-2 py-3 flex gap-3">
            <div
                title="Drag to reorder"
                className={cn(
                    "text-muted-foreground",
                    disabled ? "cursor-not-allowed" : "cursor-grab hover:text-primary hover:scale-110"
                )}
            >
                <GripVerticalIcon className="size-6" />
            </div>
            <div className="grow flex items-center justify-items-start gap-2">
                <span className="line-clamp-1">
                    {reason}
                </span>
                <div className={cn(
                    "bg-black/50 opacity-75 px-2 py-0.5 text-sm rounded shrink-0 uppercase",
                    duration === 'permanent' ? 'text-red-500' : 'text-primary'
                )}>
                    {duration}
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
        </li>
    )
}

type PresetListAddItemButtonProps = {
    onClick: () => void;
    disabled: boolean;
}

function PresetListAddItemButton({ onClick, disabled }: PresetListAddItemButtonProps) {
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

const tmpInitialState = [
    {
        id: '1',
        reason: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        duration: '2 hours'
    },
    { id: '2', reason: 'Hacking or cheating', duration: 'permanent' },
    { id: '3', reason: 'Exploiting or griefing', duration: '1 week' },
    { id: '4', reason: 'Racism, harassment or bullying', duration: '2 hours' },
    { id: '5', reason: 'Inappropriate language', duration: '1 day' },
    { id: '6', reason: 'Spamming or trolling', duration: 'permanent' },
]

export default function PresetReasons() {
    const [savedReasons, setSavedReasons] = useState(tmpInitialState);
    const openConfirmDialog = useOpenConfirmDialog();
    const { hasPerm } = useAdminPerms();

    const handleAddNewItem = () => {
        console.log('Add new item');
    }
    const handleRemoveItem = (id: string) => {
        openConfirmDialog({
            title: 'Remove Reason',
            message: <>
                Are you sure you want to remove this reason? <br />
                <blockquote className='opacity-70 italic border-l-4 pl-2'>
                    {savedReasons.find((item) => item.id === id)?.reason}
                </blockquote>
            </>,
            onConfirm: () => {
                console.log('Remove item', id);
                setSavedReasons((prev) => prev.filter((item) => item.id !== id));
            },
            confirmBtnVariant: 'destructive',
        });
    }
    const handleEditItem = (id: string) => {
        console.log('Edit item', id);
    }

    const canEdit = hasPerm('settings.write');
    return (
        <div className="space-y-4 w-[1000px] w-fullx mx-auto">
            <div>
                <h1 className="text-3xl">Preset Ban Reasons</h1>
                <p>
                    Here you can configure ban reasons and durations that will appear as dropdown options when banning a player. <br />
                    This is useful for common reasons that are used frequently, like violation of your server rules. <br />

                    {canEdit ? (
                        <span className="text-muted-foreground italic">
                            TIP: You can also drag and drop to reorder the list. <br />
                        </span>
                    ) : (
                        <span className="text-warning-inline">
                            You need the <InlineCode className="text-warning-inline">Settings: Change</InlineCode> permission to edit these reasons.
                        </span>
                    )}
                </p>
            </div>
            <ol className="space-y-2 border p-2 rounded-lg">
                {savedReasons.map((item) => (
                    <PresetListItem
                        key={item.id}
                        {...item}
                        onEdit={handleEditItem}
                        onRemove={handleRemoveItem}
                        disabled={!canEdit}
                    />
                ))}
                <PresetListAddItemButton onClick={handleAddNewItem} disabled={!canEdit} />
            </ol>
        </div>
    );
}
