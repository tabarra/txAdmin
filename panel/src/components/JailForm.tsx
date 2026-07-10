import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// Types
type JailFormRespType = {
    reason: string;
    duration: string;
}
export type JailFormType = HTMLDivElement & {
    focusReason: () => void;
    clearData: () => void;
    getData: () => JailFormRespType;
}
type JailFormProps = {
    disabled?: boolean;
};

/**
 * A form to set jail reason and duration.
 * NOTE: jails cannot be permanent, and the time only counts while the player is online.
 */
export default forwardRef(function JailForm({ disabled }: JailFormProps, ref) {
    const reasonRef = useRef<HTMLInputElement>(null);
    const customMultiplierRef = useRef<HTMLInputElement>(null);
    const [currentDuration, setCurrentDuration] = useState('30 minutes');
    const [customUnits, setCustomUnits] = useState('minutes');

    //Exposing methods to the parent
    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                const reason = reasonRef.current?.value?.trim() ?? '';
                let duration = currentDuration;
                if (currentDuration === 'custom') {
                    const mult = parseInt(customMultiplierRef.current?.value ?? '', 10);
                    duration = Number.isFinite(mult) && mult > 0 ? `${mult} ${customUnits}` : `1 ${customUnits}`;
                }
                return { reason, duration };
            },
            clearData: () => {
                if (!reasonRef.current || !customMultiplierRef.current) return;
                reasonRef.current.value = '';
                customMultiplierRef.current.value = '';
                setCurrentDuration('30 minutes');
                setCustomUnits('minutes');
            },
            focusReason: () => {
                reasonRef.current?.focus();
            }
        };
    }, [reasonRef, customMultiplierRef, currentDuration, customUnits]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <Label htmlFor="jailReason">
                    Reason
                </Label>
                <Input
                    id="jailReason"
                    ref={reasonRef}
                    placeholder="The reason for the jail, rule violated, etc."
                    className="w-full"
                    disabled={disabled}
                    autoFocus
                />
            </div>
            <div className="flex flex-col gap-3">
                <Label htmlFor="jailDurationSelect">
                    Duration
                </Label>
                <div className="space-y-1">
                    <Select
                        onValueChange={setCurrentDuration}
                        value={currentDuration}
                        disabled={disabled}
                    >
                        <SelectTrigger id="jailDurationSelect" className="tracking-wide">
                            <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>
                        <SelectContent className="tracking-wide">
                            <SelectItem value="custom" className="font-bold">Custom (set below)</SelectItem>
                            <SelectItem value="15 minutes">15 MINUTES</SelectItem>
                            <SelectItem value="30 minutes">30 MINUTES</SelectItem>
                            <SelectItem value="1 hours">1 HOUR</SelectItem>
                            <SelectItem value="2 hours">2 HOURS</SelectItem>
                            <SelectItem value="8 hours">8 HOURS</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex flex-row gap-2">
                        <Input
                            id="jailDurationMultiplier"
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
                                id="jailDurationUnits"
                                disabled={currentDuration !== 'custom' || disabled}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="tracking-wide">
                                <SelectItem value="minutes">MINUTES</SelectItem>
                                <SelectItem value="hours">HOURS</SelectItem>
                                <SelectItem value="days">DAYS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    The time only counts while the player is online. If they disconnect, the countdown resumes when they rejoin.
                </p>
            </div>
        </div>
    );
});
