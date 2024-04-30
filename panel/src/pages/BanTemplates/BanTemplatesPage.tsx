import InlineCode from "@/components/InlineCode";
import { useAdminPerms } from "@/hooks/auth";
import { useOpenConfirmDialog } from "@/hooks/dialogs";
import { useState } from "react";
import BanTemplatesInputDialog from "./BanTemplatesInputDialog";
import BanTemplatesListItem from "./BanTemplatesListItem";
import BanTemplatesListAddButton from "./BanTemplatesListAddButton";
import { BanDurationType } from "@shared/otherTypes";
import { DndSortableGroup, DndSortableItem } from "@/components/dndSortable";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";


type BanTemplates = {
    id: string;
    reason: string;
    duration: BanDurationType;
}

//DEBUG: Temporary initial state
export const tmpInitialState: BanTemplates[] = [
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


export type BanTemplatesInputData = {
    id: string | null;
    reason: string;
    duration: BanDurationType;
}

export default function BanTemplatesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reasonInputDialogData, setReasonInputDialogData] = useState<BanTemplatesInputData | undefined>();

    const [savedReasons, setSavedReasons] = useState(tmpInitialState);
    const openConfirmDialog = useOpenConfirmDialog();
    const { hasPerm } = useAdminPerms();

    //Drag and drop
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSavedReasons((items) => {
                const oldIndex = items.findIndex(x => x.id === active.id);
                const newIndex = items.findIndex(x => x.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    const handleOnSave = ({ id, reason, duration }: BanTemplatesInputData) => {
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


    //Status display
    const isFetching = false;
    // const loadError = true;
    const loadError = 'Lorem ipsum dolor sit amet consectetur adipiscing.';
    const saveSuccessfull = false;
    let statusNode: React.ReactNode;
    if (isFetching) {
        statusNode = <span className="text-success-inline animate-pulse">
            Saving...
        </span>
    } else if (loadError) {
        statusNode = <div className="inline-flex flex-wrap gap-1">
            <span className='text-destructive-inline'>Error saving: {loadError}</span><br />
            <button className='underline hover:text-accent' onClick={() => { }}>Try again?</button>
        </div>
    } else if (saveSuccessfull) {
        statusNode = <span className="text-success-inline">
            Saved.
        </span>
    }

    //Rendering
    const canEdit = hasPerm('settings.write');
    return <>
        <div className="space-y-4 w-fullx w-[1000px] DEBUG mx-auto">
            <div className="px-2 md:px-0">
                <h1 className="text-3xl mb-2">Ban Templates</h1>
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
            <div className="space-y-2">
                <div className="flex flex-wrap justify-between text-muted-foreground px-2 md:px-0">
                    <span className="shrink-0">Configured reasons: {savedReasons.length}</span>
                    {statusNode}
                </div>
                <DndSortableGroup
                    className="space-y-2 border p-2 rounded-lg"
                    ids={savedReasons.map((item) => item.id)}
                    onDragEnd={handleDragEnd}
                >
                    {savedReasons.map((item) => (
                        <DndSortableItem key={item.id} id={item.id} disabled={!canEdit}>
                            <BanTemplatesListItem
                                onEdit={handleEditItem}
                                onRemove={handleRemoveItem}
                                disabled={!canEdit}
                                {...item}
                            />
                        </DndSortableItem>
                    ))}
                    <BanTemplatesListAddButton onClick={handleAddNewItem} disabled={!canEdit} />
                </DndSortableGroup>
            </div>
        </div>
        <BanTemplatesInputDialog
            key={reasonInputDialogData?.id}
            reasonData={reasonInputDialogData}
            onSave={handleOnSave}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
        />
    </>;
}
