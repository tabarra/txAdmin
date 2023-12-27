import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, msToDuration, tsToLocaleDate } from "@/lib/utils";
import { PlayerModalPlayerData } from "@shared/playerApiTypes";
import { useRef, useState } from "react";


function LogActionCounter({ type, count }: { type: 'Ban' | 'Warn', count: number }) {
    const pluralLabel = (count > 1) ? `${type}s` : type;
    if (count === 0) {
        return <span className={cn(
            'rounded-sm text-xs font-semibold px-1 py-[0.125rem] tracking-widest text-center inline-block',
            'bg-secondary text-secondary-foreground'
        )}>
            0 {type}s
        </span>
    } else {
        return <span className={cn(
            'rounded-sm text-xs font-semibold px-1 py-[0.125rem] tracking-widest text-center inline-block',
            type === 'Ban' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
        )}>
            {count} {pluralLabel}
        </span>
    }
}


function PlayerNotesBox({ player }: { player: PlayerModalPlayerData }) {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [notesLogText, setNotesLogText] = useState(player.notesLog ?? '');

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            setNotesLogText('Saving...');
            // FIXME: send request to save notes
            setTimeout(() => {
                setNotesLogText('Saved!');
            }, 2000);
            console.log(textAreaRef.current?.value)
        }
    }

    return <>
        <Label htmlFor="playerNotes">
            Notes: <span className="text-muted-foreground">{notesLogText}</span>
        </Label>
        <Textarea
            ref={textAreaRef}
            id="playerNotes"
            className="w-full mt-1"
            disabled={!player.isRegistered}
            defaultValue={player.notes}
            onChange={() => setNotesLogText('Press enter to save.')}
            onKeyDown={handleKeyDown}
            placeholder={player.isRegistered
                ? 'Type your notes about the player.'
                : 'Cannot set notes for players that are not registered.'}
        />
    </>
}

type InfoTabProps = {
    player: PlayerModalPlayerData,
    setSelectedTab: (t: string) => void,
}

export default function InfoTab({ player, setSelectedTab }: InfoTabProps) {
    const sessionTimeText = player.sessionTime ? msToDuration(
        player.sessionTime * 60_000,
        { units: ['h', 'm'] }
    ) : '--';
    const lastConnectionText = player.tsLastConnection
        ? tsToLocaleDate(player.tsLastConnection)
        : '--';
    const playTimeText = player.playTime ? msToDuration(
        player.playTime * 60_000,
        { units: ['d', 'h', 'm'] }
    ) : '--';
    const joinDateText = player.tsJoined ? tsToLocaleDate(player.tsJoined) : '--';
    const whitelistedText = player.tsWhitelisted ? tsToLocaleDate(player.tsWhitelisted) : 'not yet';
    const banCount = player.actionHistory.filter((a) => a.type === 'ban').length;
    const warnCount = player.actionHistory.filter((a) => a.type === 'warn').length;

    return <div className="p-1">
        <dl className="pb-2">
            {player.isConnected && <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Session Time</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">{sessionTimeText}</dd>
            </div>}
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Play Time</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">{playTimeText}</dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Join Date</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">{joinDateText}</dd>
            </div>
            {!player.isConnected && <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Last Connection</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">{lastConnectionText}</dd>
            </div>}

            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Whitelisted</dt>
                <dd className="text-sm leading-6 mt-0">{whitelistedText}</dd>
                <dd className="text-right">
                    <Button
                        variant="outline"
                        size='inline'
                        style={{ minWidth: '8.25ch' }}
                        onClick={() => { }} //FIXME:
                        disabled={false} //FIXME:
                    >
                        {player.tsWhitelisted ? 'Remove' : 'Add WL'}
                    </Button>
                </dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Log</dt>
                <dd className="text-sm leading-6 mt-0 space-x-2">
                    <LogActionCounter type="Ban" count={banCount} />
                    <LogActionCounter type="Warn" count={warnCount} />
                </dd>
                <dd className="text-right">
                    <Button
                        variant="outline"
                        size='inline'
                        style={{ minWidth: '8.25ch' }}
                        onClick={() => {setSelectedTab('History')}}
                    >View</Button>
                </dd>
            </div>
        </dl>

        <PlayerNotesBox player={player} />
    </div>;
}
