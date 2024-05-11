import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClosePlayerModal } from "@/hooks/playerModal";
import { ClipboardPasteIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { DropDownSelect, DropDownSelectContent, DropDownSelectItem, DropDownSelectTrigger } from "@/components/dropDownSelect";
import { banDurationToShortString, banDurationToString, cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { DynamicNewItem } from "@/components/DynamicNewBadge";
import type { BanTemplatesDataType } from "@shared/otherTypes";

// Consts
const reasonTruncateLength = 150;
const ADD_NEW_SELECT_OPTION = '!add-new';
const defaultDurations = ['permanent', '2 hours', '8 hours', '1 day', '2 days', '1 week', '2 weeks'];

// Types
type BanFormRespType = {
    reason: string;
    duration: string;
}
export type BanFormType = HTMLDivElement & {
    focusReason: () => void;
    clearData: () => void;
    getData: () => BanFormRespType;
}
type BanFormProps = {
    banTemplates?: BanTemplatesDataType[]; //undefined = loading
    disabled?: boolean;
    onNavigateAway?: () => void;
};

/**
 * A form to set ban reason and duration.
 */
export default forwardRef(function BanForm({ banTemplates, disabled, onNavigateAway }: BanFormProps, ref) {
    const reasonRef = useRef<HTMLInputElement>(null);
    const customMultiplierRef = useRef<HTMLInputElement>(null);
    const setLocation = useLocation()[1];
    const [currentDuration, setCurrentDuration] = useState('2 days');
    const [customUnits, setCustomUnits] = useState('days');
    const closeModal = useClosePlayerModal();

    //Exposing methods to the parent
    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return {
                    reason: reasonRef.current?.value.trim(),
                    duration: currentDuration === 'custom'
                        ? `${customMultiplierRef.current?.value} ${customUnits}`
                        : currentDuration,
                };
            },
            clearData: () => {
                if (!reasonRef.current || !customMultiplierRef.current) return;
                reasonRef.current.value = '';
                customMultiplierRef.current.value = '';
                setCurrentDuration('2 days');
                setCustomUnits('days');
            },
            focusReason: () => {
                reasonRef.current?.focus();
            }
        };
    }, []);

    const handleTemplateSelectChange = (value: string) => {
        if (value === ADD_NEW_SELECT_OPTION) {
            setLocation('/settings/ban-templates');
            onNavigateAway?.();
        } else {
            if (!banTemplates) return;
            const template = banTemplates.find(template => template.id === value);
            if (!template) return;

            const processedDuration = banDurationToString(template.duration);
            if (defaultDurations.includes(processedDuration)) {
                setCurrentDuration(processedDuration);
            } else if (typeof template.duration === 'object') {
                setCurrentDuration('custom');
                customMultiplierRef.current!.value = template.duration.value.toString();
                setCustomUnits(template.duration.unit);
            }

            reasonRef.current!.value = template.reason;
            setTimeout(() => {
                reasonRef.current!.focus();
            }, 50);
        }
    }

    //Ban templates render optimization
    const processedTemplates = useMemo(() => {
        if (!banTemplates) return;
        return banTemplates.map((template, index) => {
            const duration = banDurationToShortString(template.duration);
            const reason = template.reason.length > reasonTruncateLength
                ? template.reason.slice(0, reasonTruncateLength - 3) + '...'
                : template.reason;
            return (
                <DropDownSelectItem
                    key={index}
                    value={template.id}
                    className="focus:bg-secondary focus:text-secondary-foreground"
                >
                    <span
                        className="inline-block pr-1 font-mono opacity-75 min-w-[4ch]"
                    >{duration}</span> {reason}
                </DropDownSelectItem>
            );
        });
    }, [banTemplates]);

    // Simplifying the jsx below
    let banTemplatesContentNode: React.ReactNode;
    if (!Array.isArray(banTemplates)) {
        banTemplatesContentNode = (
            <div className="text-secondary-foreground text-center p-4">
                <Loader2Icon className="inline animate-spin size-6" />
            </div>
        );
    } else {
        if (!banTemplates.length) {
            banTemplatesContentNode = (
                <div className="text-warning-inline text-center p-4">
                    You do not have any template configured. <br />
                    <Link
                        href="/settings/ban-templates"
                        className="cursor-pointer underline hover:text-accent"
                        onClick={() => { closeModal(); }}
                    >
                        Add Ban Template
                        <ExternalLinkIcon className="inline mr-1 h-4" />
                    </Link>
                </div>
            );
        } else {
            banTemplatesContentNode = <>
                {processedTemplates}
                <DropDownSelectItem
                    value={ADD_NEW_SELECT_OPTION}
                    className="font-bold text-warning-inline"
                >
                    Add Ban Template
                    <ExternalLinkIcon className="inline mr-1 h-4" />
                </DropDownSelectItem>
            </>;
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <Label htmlFor="banReason">
                    Reason
                </Label>
                <div className="flex gap-1">
                    <Input
                        id="banReason"
                        ref={reasonRef}
                        placeholder="The reason for the ban, rule violated, etc."
                        className="w-full"
                        disabled={disabled}
                        autoFocus
                    />
                    <DropDownSelect onValueChange={handleTemplateSelectChange} disabled={disabled}>
                        <DropDownSelectTrigger className="tracking-wide">
                            <button
                                className={cn(
                                    'relative', //FIXME: REMOVE THIS LINE - DynamicNewItem
                                    'size-10 inline-flex justify-center items-center rounded-md shrink-0',
                                    'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    'border bg-black/20 shadow-sm',
                                    'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                )}
                            >
                                <ClipboardPasteIcon className="size-5" />
                                <DynamicNewItem featName="banTemplates" durationDays={7}>
                                    <div className="absolute rounded-full size-2 -top-1 -right-1 bg-accent" />
                                </DynamicNewItem>
                            </button>
                        </DropDownSelectTrigger>
                        <DropDownSelectContent className="tracking-wide w-[calc(100vw-1rem)] sm:max-w-screen-sm" align="end">
                            {banTemplatesContentNode}
                        </DropDownSelectContent>
                    </DropDownSelect>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <Label htmlFor="durationSelect">
                    Duration
                </Label>
                <div className="space-y-1">
                    <Select
                        onValueChange={setCurrentDuration}
                        value={currentDuration}
                        disabled={disabled}
                    >
                        <SelectTrigger id="durationSelect" className="tracking-wide">
                            <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>
                        <SelectContent className="tracking-wide">
                            <SelectItem value="custom" className="font-bold">Custom (set below)</SelectItem>
                            <SelectItem value="2 hours">2 HOURS</SelectItem>
                            <SelectItem value="8 hours">8 HOURS</SelectItem>
                            <SelectItem value="1 day">1 DAY</SelectItem>
                            <SelectItem value="2 days">2 DAYS</SelectItem>
                            <SelectItem value="1 week">1 WEEK</SelectItem>
                            <SelectItem value="2 weeks">2 WEEKS</SelectItem>
                            <SelectItem value="permanent" className="font-bold">Permanent</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex flex-row gap-2">
                        <Input
                            id="durationMultiplier"
                            type="number"
                            placeholder="123"
                            required
                            disabled={currentDuration !== 'custom' || disabled}
                            ref={customMultiplierRef}
                        />
                        <Select
                            onValueChange={setCustomUnits}
                            value={customUnits}
                        >
                            <SelectTrigger
                                className="tracking-wide"
                                id="durationUnits"
                                disabled={currentDuration !== 'custom' || disabled}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="tracking-wide">
                                <SelectItem value="hours">HOURS</SelectItem>
                                <SelectItem value="days">DAYS</SelectItem>
                                <SelectItem value="weeks">WEEKS</SelectItem>
                                <SelectItem value="months">MONTHS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
});
