import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPerms } from "@/hooks/auth";
import { PlayerModalRefType, useClosePlayerModal } from "@/hooks/playerModal";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import ModalCentralMessage from "@/components/ModalCentralMessage";


export default function PlayerBanTab({ playerRef }: { playerRef: PlayerModalRefType }) {
    const reasonRef = useRef<HTMLInputElement>(null);
    const customMultiplierRef = useRef<HTMLInputElement>(null);
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

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 p-1">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="banReason" className="col-span-4 xs:col-auto">
                    Reason
                </Label>
                <Input
                    id="banReason"
                    placeholder="The reason for the ban, rule violated, etc."
                    className="col-span-full xs:col-span-3"
                    ref={reasonRef}
                    autoFocus
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="durationSelect" className="col-span-4 xs:col-auto">
                    Duration
                </Label>
                <div className="col-span-full xs:col-span-3 space-y-1 ">
                    <Select
                        onValueChange={setCurrentDuration}
                        defaultValue={currentDuration}
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
                            defaultValue={customUnits}
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
