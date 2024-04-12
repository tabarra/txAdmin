import InlineCode from "@/components/InlineCode";
import { useAdminPerms } from "@/hooks/auth";
import { useOpenConfirmDialog } from "@/hooks/dialogs";
import { useState } from "react";
import PresetReasonInputDialog from "./PresetReasonInputDialog";
import PresetReasonListItem from "./PresetReasonListItem";
import PresetReasonListAddButton from "./PresetReasonListAddButton";
import { BanDurationType } from "@shared/otherTypes";


type PresetReason = {
    id: string;
    reason: string;
    duration: BanDurationType;
}

//DEBUG: Temporary initial state
export const tmpInitialState: PresetReason[] = [
    {
        id: '1',
        reason: 'Night of. Forth Let place life it created stars all grass. Abundantly. Saying whose darkness brought it rule whales. For forth for upon doesn\'t move us subdue have creeping lesser forth moved. A them man place sea you evening air called second to kind gathered lights evening is. Give multiply them be was you\'re there.',
        duration: { value: 2, unit: 'hours' }
    },
    { id: '2', reason: 'Hacking or cheating', duration: 'permanent' },
    { id: '3', reason: 'Exploiting or griefing', duration: { value: 1, unit: 'weeks' } },
    { id: '4', reason: 'Racism, harassment or bullying', duration: { value: 8, unit: 'hours' } },
    { id: '5', reason: 'Inappropriate language', duration: { value: 1, unit: 'days' } },
    { id: '6', reason: 'Spamming or trolling', duration: 'permanent' },
];

//Converts the duration object to a lowercase string with correct unit pluralization
export const banDurationToString = (duration: BanDurationType) => {
    if (duration === 'permanent') return 'permanent';
    if (typeof duration === 'string') return duration;
    const pluralizedString = duration.value === 1 ? duration.unit.slice(0, -1) : duration.unit;
    return `${duration.value} ${pluralizedString}`;
}


export type PresetReasonInputData = {
    id: string | null;
    reason: string;
    duration: BanDurationType;
}

export default function PresetReasons() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reasonInputDialogData, setReasonInputDialogData] = useState<PresetReasonInputData | undefined>();

    const [savedReasons, setSavedReasons] = useState(tmpInitialState);
    const openConfirmDialog = useOpenConfirmDialog();
    const { hasPerm } = useAdminPerms();

    const handleOnSave = ({ id, reason, duration }: PresetReasonInputData) => {
        console.log('Save item', id, reason, duration);
        if (id) {
            setSavedReasons((prev) =>
                prev.map((item) =>
                    item.id === id ? { id, reason, duration } : item
                )
            );
        } else {
            setSavedReasons((prev) => [
                ...prev,
                { id: Math.random().toString(), reason, duration },
            ]);
        }
        setIsDialogOpen(false);
        setReasonInputDialogData(undefined);
    }

    //Handler for list actions
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
        setReasonInputDialogData(savedReasons.find((item) => item.id === id));
        setIsDialogOpen(true);
    }
    const handleAddNewItem = () => {
        setReasonInputDialogData(undefined);
        setIsDialogOpen(true);
    }

    const canEdit = hasPerm('settings.write');
    return <>
        <div className="space-y-4 w-fullx w-[1000px] mx-auto">
            <div>
                <h1 className="text-3xl mb-2">Preset Ban Reasons</h1>
                <p>
                    Here you can configure ban reasons and durations that will appear as dropdown options when banning a player. <br />
                    This is useful for common reasons that happen frequently, like violation of your server rules. <br />

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
                    <PresetReasonListItem
                        key={item.id}
                        {...item}
                        onEdit={handleEditItem}
                        onRemove={handleRemoveItem}
                        disabled={!canEdit}
                    />
                ))}
                <PresetReasonListAddButton onClick={handleAddNewItem} disabled={!canEdit} />
            </ol>
        </div>
        <PresetReasonInputDialog
            key={reasonInputDialogData?.id}
            reasonData={reasonInputDialogData}
            onSave={handleOnSave}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
        />
    </>;
}
