//NOTE: this is not part of the original shadcn/ui
// ref: https://shadcnui-expansions.typeart.cc/docs/autosize-textarea

'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useImperativeHandle } from 'react';

interface UseAutosizeTextAreaProps {
    textAreaRef: HTMLTextAreaElement | null;
    minHeight?: number;
    maxHeight?: number;
    triggerAutoSize: string;
}

export const useAutosizeTextArea = ({
    textAreaRef,
    triggerAutoSize,
    maxHeight = Number.MAX_SAFE_INTEGER,
    minHeight = 0,
}: UseAutosizeTextAreaProps) => {
    const [init, setInit] = React.useState(true);
    React.useEffect(() => {
        // We need to reset the height momentarily to get the correct scrollHeight for the textarea
        const offsetBorder = 2;
        if (textAreaRef) {
            if (init) {
                textAreaRef.style.minHeight = `${minHeight + offsetBorder}px`;
                if (maxHeight > minHeight) {
                    textAreaRef.style.maxHeight = `${maxHeight}px`;
                }
                setInit(false);
            }
            textAreaRef.style.height = `${minHeight + offsetBorder}px`;
            const scrollHeight = textAreaRef.scrollHeight;
            // We then set the height directly, outside of the render loop
            // Trying to set this with state or a ref will product an incorrect value.
            if (scrollHeight > maxHeight) {
                textAreaRef.style.height = `${maxHeight}px`;
            } else {
                textAreaRef.style.height = `${scrollHeight + offsetBorder}px`;
            }
        }
    }, [textAreaRef, triggerAutoSize]);
};

export type AutosizeTextAreaRef = {
    textArea: HTMLTextAreaElement;
    maxHeight: number;
    minHeight: number;
};

type AutosizeTextAreaProps = {
    maxHeight?: number;
    minHeight?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutosizeTextarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(
    (
        {
            maxHeight = Number.MAX_SAFE_INTEGER,
            minHeight = 52,
            className,
            onChange,
            value,
            ...props
        }: AutosizeTextAreaProps,
        ref: React.Ref<AutosizeTextAreaRef>,
    ) => {
        const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
        const [triggerAutoSize, setTriggerAutoSize] = React.useState('');

        useAutosizeTextArea({
            textAreaRef: textAreaRef.current,
            triggerAutoSize: triggerAutoSize,
            maxHeight,
            minHeight,
        });

        useImperativeHandle(ref, () => ({
            textArea: textAreaRef.current as HTMLTextAreaElement,
            maxHeight,
            minHeight,
        }));

        React.useEffect(() => {
            if (value || props?.defaultValue) {
                setTriggerAutoSize(value as string);
            }
        }, [value, props?.defaultValue]);

        return (
            <textarea
                {...props}
                value={value}
                ref={textAreaRef}
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "bg-black/5 dark:bg-black/30", //TX CUSTOM
                    className,
                )}
                onChange={(e) => {
                    setTriggerAutoSize(e.target.value);
                    onChange?.(e);
                }}
            />
        );
    },
);
AutosizeTextarea.displayName = 'AutosizeTextarea';
