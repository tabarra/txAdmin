import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPerms } from "@/hooks/auth";
import { PlayerModalRefType } from "@/hooks/playerModal";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { PlayerModalMidMessage } from "./PlayerModal";


export default function BanTab({ playerRef }: { playerRef: Exclude<PlayerModalRefType, undefined> }) {
    const reasonRef = useRef<HTMLInputElement>(null);
    const [currentDuration, setCurrentDuration] = useState('2 days');
    const [customMultiplier, setCustomMultipler] = useState('2');
    const [customUnits, setCustomUnits] = useState('days');
    const [isSaving, setIsSaving] = useState(false);
    const { hasPerm } = useAdminPerms();
    if(!hasPerm('players.ban')) {
        return <PlayerModalMidMessage>
            You don't have permission to ban players.
        </PlayerModalMidMessage>;
    }


    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        setIsSaving(true);
        console.group('Ban Player submit');
        console.log('Reason:', reasonRef.current?.value);
        console.log('Duration:', currentDuration);
        console.log('Custom Multiplier:', customMultiplier);
        console.log('Custom Units:', customUnits);
        console.log('Player:', playerRef);
        console.groupEnd();
        setTimeout(() => {
            setIsSaving(false);
        }, 2000);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 p-1">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="col-span-4 xs:col-auto">
                    Reason
                </Label>
                <Input
                    id="name"
                    placeholder="doing bad things :("
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
                        <SelectTrigger id="durationSelect">
                            <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2 hours">2 hours</SelectItem>
                            <SelectItem value="8 hours">8 hours</SelectItem>
                            <SelectItem value="1 day">1 day</SelectItem>
                            <SelectItem value="2 days">2 days</SelectItem>
                            <SelectItem value="1 week">1 week</SelectItem>
                            <SelectItem value="2 weeks">2 weeks</SelectItem>
                            <SelectItem value="permanent" className="font-weight-bold text-danger">permanent</SelectItem>
                            <SelectItem value="custom" className="font-weight-bold">custom</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex flex-row gap-2">
                        <Input
                            id="durationMultiplier"
                            type="number"
                            className=""
                            disabled={currentDuration !== 'custom'}
                            defaultValue={customMultiplier}
                            onChange={(e) => setCustomMultipler(e.target.value)}
                        />
                        <Select
                            onValueChange={setCustomUnits}
                            defaultValue={customUnits}
                        >
                            <SelectTrigger
                                id="durationUnits"
                                disabled={currentDuration !== 'custom'}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hours">hours</SelectItem>
                                <SelectItem value="days">days</SelectItem>
                                <SelectItem value="weeks">weeks</SelectItem>
                                <SelectItem value="months">months</SelectItem>
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
