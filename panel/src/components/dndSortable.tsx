import { cn } from "@/lib/utils";
import { GripVerticalIcon } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAutoAnimate } from '@formkit/auto-animate/react';


type DndSortableItemProps = {
    id: string;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function DndSortableItem({ id, disabled, className, children }: DndSortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id, disabled });

    attributes.role = 'listitem'; //Override role due to having a drag handle
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform && {
            ...transform,
            scaleY: 1, //prevent default squishing behavior for multiline items
        }),
        transition,
    };

    return (
        <li
            ref={setNodeRef} style={style} {...attributes}
            className={cn(
                "bg-card rounded-lg border px-2 py-3 flex gap-3 relative aria-pressed:z-50 aria-pressed:opacity-85 aria-pressed:shadow-xl",
                className
            )}
        >
            <div
                {...listeners}
                title="Drag to reorder"
                className={cn(
                    "text-muted-foreground my-auto",
                    disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-grab hover:text-primary hover:scale-110"
                )}
            >
                <GripVerticalIcon className="size-6" />
            </div>
            {children}
        </li>
    )
}


type DndSortableGroupProps = {
    onDragEnd: (event: DragEndEvent) => void;
    children: React.ReactNode;
    className?: string;
    ids: string[];
}

export function DndSortableGroup({ onDragEnd, className, children, ids }: DndSortableGroupProps) {
    const [autoAnimateParentRef, enableAnimations] = useAutoAnimate();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        onDragEnd(event);
        setTimeout(() => {
            enableAnimations(true);
        }, 1);
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => enableAnimations(false)}
            onDragCancel={() => enableAnimations(true)}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={ids}
                strategy={verticalListSortingStrategy}
            >
                <ol
                    ref={autoAnimateParentRef}
                    className={className}
                >
                    {children}
                </ol>
            </SortableContext>
        </DndContext>
    )
}
