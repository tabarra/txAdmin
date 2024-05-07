import InlineCode from "@/components/InlineCode";
import { useAdminPerms } from "@/hooks/auth";
import { useOpenConfirmDialog } from "@/hooks/dialogs";
import { useEffect, useState } from "react";
import BanTemplatesInputDialog from "./BanTemplatesInputDialog";
import BanTemplatesListItem from "./BanTemplatesListItem";
import BanTemplatesListAddButton from "./BanTemplatesListAddButton";
import { BanDurationType, BanTemplatesDataType, GetBanTemplatesSuccessResp, SaveBanTemplatesReq, SaveBanTemplatesResp } from "@shared/otherTypes";
import { DndSortableGroup, DndSortableItem } from "@/components/dndSortable";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BackendApiError, useBackendApi } from "@/hooks/fetch";
import { Loader2Icon } from "lucide-react";
import useSWR from "swr";
import { nanoid } from "nanoid";


export type BanTemplatesInputData = {
    id: string | null;
    reason: string;
    duration: BanDurationType;
}

type DataUpdaterFunc = (prev: BanTemplatesDataType[]) => BanTemplatesDataType[];

export default function BanTemplatesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reasonInputDialogData, setReasonInputDialogData] = useState<BanTemplatesInputData | undefined>();
    const openConfirmDialog = useOpenConfirmDialog();
    const { hasPerm } = useAdminPerms();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaveSuccessful, setIsSaveSuccessful] = useState(false);

    const queryApi = useBackendApi<GetBanTemplatesSuccessResp>({
        method: 'GET',
        path: `/settings/banTemplates`,
        throwGenericErrors: true,
    });

    const saveApi = useBackendApi<SaveBanTemplatesResp, SaveBanTemplatesReq>({
        method: 'POST',
        path: `/settings/banTemplates`,
        throwGenericErrors: true,
    });

    const swr = useSWR('/settings/banTemplates', async () => {
        const data = await queryApi({});
        if (!data) throw new Error('No data returned');
        return data;
    }, {
        isPaused: () => (isSaving || !!saveError || isDialogOpen),
    });

    const updateBackend = async (updater: DataUpdaterFunc) => {
        setIsSaving(true);
        setSaveError(null);
        setIsSaveSuccessful(false);
        try {
            const data = await swr.mutate(updater as any, false);
            const resp = await saveApi({ data });
            if (!resp) throw new Error('No data returned');
            setIsSaveSuccessful(true);
        } catch (error) {
            if (error instanceof BackendApiError || error instanceof Error) {
                setSaveError(error.message);
            } else {
                setSaveError(JSON.stringify(error));
            }
        } finally {
            setIsSaving(false);
        }
    }

    //Clear the save successful after 5 seconds
    useEffect(() => {
        if (!isSaveSuccessful) return;
        const timeout = setTimeout(() => {
            setIsSaveSuccessful(false);
        }, 5000);
        return () => clearTimeout(timeout);
    }, [isSaveSuccessful]);


    //Drag and drop
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            updateBackend((items) => {
                const oldIndex = items.findIndex(x => x.id === active.id);
                const newIndex = items.findIndex(x => x.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    const handleOnSave = ({ id, reason, duration }: BanTemplatesInputData) => {
        console.log('Save item', id, reason, duration);
        if (id) {
            updateBackend((prev) =>
                prev.map((item) =>
                    item.id === id ? { id, reason, duration } : item
                )
            );
        } else {
            updateBackend((prev) => [
                ...prev,
                {
                    id: nanoid(21),
                    reason,
                    duration
                },
            ]);
        }
        setIsDialogOpen(false);
        setReasonInputDialogData(undefined);
    }

    //Handler for list actions
    const handleRemoveItem = (id: string) => {
        if (!id || !swr.data) return;
        const toBeRemoved = swr.data.find((item) => item.id === id);
        if (!toBeRemoved) return;
        openConfirmDialog({
            title: 'Remove Template',
            actionLabel: 'Remove',
            confirmBtnVariant: 'destructive',
            message: <>
                Are you sure you want to remove this ban template? <br />
                <blockquote className='opacity-70 italic border-l-4 pl-2'>
                    {toBeRemoved.reason}
                </blockquote>
            </>,
            onConfirm: () => {
                console.log('Remove confirmed', id);
                updateBackend((prev) => prev.filter((item) => item.id !== id));
            },
        });
    }
    const handleEditItem = (id: string) => {
        if (!id || !swr.data) return;
        console.log('Edit item', id);
        setReasonInputDialogData(swr.data.find((item) => item.id === id));
        setIsDialogOpen(true);
    }
    const handleAddNewItem = () => {
        setReasonInputDialogData(undefined);
        setIsDialogOpen(true);
    }


    //Status display
    let statusNode: React.ReactNode;
    if (swr.error) {
        const retryFunc = () => swr.mutate();
        const errMsg = swr?.error?.message ?? 'unknown error';
        statusNode = <div className="inline-flex flex-wrap gap-1">
            <span className='text-destructive-inline'>Error loading: {errMsg}</span><br />
            <button className='underline hover:text-accent' onClick={retryFunc}>Try again?</button>
        </div>
    } else if (isSaving) {
        statusNode = <span className="text-success-inlinex animate-pulse">
            Saving...
        </span>
    } else if (saveError) {
        const retryFunc = () => {
            if (!swr.data) return;
            updateBackend(() => swr.data!);
        }
        const errMsg = saveError ?? 'unknown error';
        statusNode = <div className="inline-flex flex-wrap gap-1">
            <span className='text-destructive-inline'>Error saving: {errMsg}</span><br />
            <button className='underline hover:text-accent' onClick={retryFunc}>Try again?</button>
        </div>
    } else if (isSaveSuccessful) {
        statusNode = <span className="text-success-inline">
            Saved.
        </span>
    } else if (swr.isLoading || swr.isValidating) {
        statusNode = <span className="text-muted-foreground">
            Loading...
        </span>
    }

    //Rendering
    const canEdit = hasPerm('settings.write');
    return <>
        <div className="space-y-4 w-full max-w-screen-lg mx-auto">
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
                    <span className="shrink-0">Configured reasons: {swr.data?.length ?? 0}</span>
                    {statusNode}
                </div>

                {!swr.data && !saveError && (
                    <div className="text-muted-foreground text-lg md:text-2xl text-center my-4 px-2 md:px-0">
                        <Loader2Icon className="inline animate-spin h-8" />Loading...
                    </div>
                )}
                {swr.data && (
                    <DndSortableGroup
                        className="space-y-2 border p-2 rounded-lg"
                        ids={swr.data.map((item) => item.id)}
                        onDragEnd={handleDragEnd}
                    >
                        {!swr.data.length ? (
                            <div className="text-muted-foreground text-lg md:text-2xl text-center my-4 px-2 md:px-0">
                                No reasons configured yet.
                            </div>
                        ) : swr.data.map((item) => (
                            <DndSortableItem
                                key={item.id}
                                id={item.id}
                                disabled={!canEdit}
                            >
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
                )}
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
