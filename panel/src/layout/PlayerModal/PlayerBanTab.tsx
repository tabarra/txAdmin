import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPerms } from "@/hooks/auth";
import { PlayerModalRefType, useClosePlayerModal } from "@/hooks/playerModal";
import { ClipboardPasteIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import ModalCentralMessage from "@/components/ModalCentralMessage";
import { DropDownSelect, DropDownSelectContent, DropDownSelectItem, DropDownSelectTrigger } from "@/components/dropDownSelect";
import { banDurationToShortString, banDurationToString, cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { DynamicNewItem } from "@/components/DynamicNewBadge";
import type { BanTemplatesDataType } from "@shared/otherTypes";


const ADD_NEW_SELECT_OPTION = '!add-new';
const maxReasonSize = 150;
const defaultDurations = ['permanent', '2 hours', '8 hours', '1 day', '2 days', '1 week', '2 weeks'];

type PlayerBanTabProps = {
    banTemplates: BanTemplatesDataType[];
    playerRef: PlayerModalRefType;
};

export default function PlayerBanTab({ playerRef, banTemplates }: PlayerBanTabProps) {
    const reasonRef = useRef<HTMLInputElement>(null);
    const customMultiplierRef = useRef<HTMLInputElement>(null);
    const setLocation = useLocation()[1];
    const [currentDuration, setCurrentDuration] = useState('2 days');
    const [customUnits, setCustomUnits] = useState('days');
    const [isSaving, setIsSaving] = useState(false);
    const { hasPerm } = useAdminPerms();
    const closeModal = useClosePlayerModal();
    const playerBanApi = useBackendApi<GenericApiOkResp>({
        method: 'POST',
        path: `/player/ban`,
    });

    if (!hasPerm('players.ban')) {
        return <ModalCentralMessage>
            You don't have permission to ban players.
        </ModalCentralMessage>;
    }

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        setIsSaving(true);
        playerBanApi({
            queryParams: playerRef,
            data: {
                reason: reasonRef.current?.value.trim(),
                duration: currentDuration === 'custom'
                    ? `${customMultiplierRef.current?.value} ${customUnits}`
                    : currentDuration,
            },
            toastLoadingMessage: 'Banning player...',
            genericHandler: {
                successMsg: 'Player banned.',
            },
            success: (data) => {
                setIsSaving(false);
                if ('success' in data) {
                    closeModal();
                }
            },
        });
    };

    const handleTemplateSelectChange = (value: string) => {
        if (value === ADD_NEW_SELECT_OPTION) {
            setLocation('/settings/ban-templates');
            closeModal();
        } else {
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

    //Optimization
    const processedTemplates = useMemo(() => {
        return banTemplates.map((template, index) => {
            const duration = banDurationToShortString(template.duration);
            const reason = template.reason.length > maxReasonSize
                ? template.reason.slice(0, maxReasonSize - 3) + '...'
                : template.reason;
            return (
                <DropDownSelectItem key={index} value={template.id}>
                    <span
                        className="inline-block pr-1 font-mono opacity-75 min-w-[4ch]"
                    >{duration}</span> {reason}
                </DropDownSelectItem>
            );
        });
    }, [banTemplates]);

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 p-1">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="banReason" className="col-span-4 xs:col-auto">
                    Reason
                </Label>
                <div className="col-span-full xs:col-span-3 flex gap-1">
                    <Input
                        id="banReason"
                        placeholder="The reason for the ban, rule violated, etc."
                        className="w-full"
                        ref={reasonRef}
                        autoFocus
                        required
                    />
                    <DropDownSelect onValueChange={handleTemplateSelectChange}>
                        <DropDownSelectTrigger className="tracking-wide">
                            <button
                                className={cn(
                                    'relative', //FIXME: REMOVE THIS LINE - DynamicNewItem
                                    'size-10 inline-flex justify-center items-center rounded-md shrink-0',
                                    'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    'border bg-black/20 shadow-sm',
                                    'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                                )}
                            >
                                <ClipboardPasteIcon className="size-5" />
                                <DynamicNewItem featName="banTemplates" durationDays={7}>
                                    <div className="absolute rounded-full size-2 -top-1 -right-1 bg-accent" />
                                </DynamicNewItem>
                            </button>
                        </DropDownSelectTrigger>
                        <DropDownSelectContent className="tracking-wide max-w-screen-sm" align="center">
                            {!banTemplates.length ? (
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
                            ) : null}
                            {processedTemplates}
                            {banTemplates.length ? (
                                <DropDownSelectItem
                                    value={ADD_NEW_SELECT_OPTION}
                                    className="font-bold text-warning-inline"
                                >
                                    Add Ban Template
                                    <ExternalLinkIcon className="inline mr-1 h-4" />
                                </DropDownSelectItem>
                            ) : null}
                        </DropDownSelectContent>
                    </DropDownSelect>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="durationSelect" className="col-span-4 xs:col-auto">
                    Duration
                </Label>
                <div className="col-span-full xs:col-span-3 space-y-1">
                    <Select
                        onValueChange={setCurrentDuration}
                        value={currentDuration}
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
                            disabled={currentDuration !== 'custom'}
                            ref={customMultiplierRef}
                        />
                        <Select
                            onValueChange={setCustomUnits}
                            value={customUnits}
                        >
                            <SelectTrigger
                                className="tracking-wide"
                                id="durationUnits"
                                disabled={currentDuration !== 'custom'}
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
            <div className="grid grid-cols-4 items-center gap-4">
                <Button
                    variant="destructive"
                    size='xs'
                    className="col-start-1 col-span-full xs:col-span-3 xs:col-start-2"
                    type="submit"
                    disabled={isSaving}
                >
                    {isSaving
                        ? <span className="flex items-center leading-relaxed">
                            <Loader2Icon className="inline animate-spin h-4" /> Banning...
                        </span>
                        : 'Apply Ban'}
                </Button>
            </div>
        </form>
    );
}
