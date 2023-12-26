import InlineCode from "@/components/InlineCode";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


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

function PlayerNotesBox() {
    return <>
        <Label htmlFor="playerNotes">
            Notes:&nbsp;
            <span className="text-muted-foreground">Last modified by <InlineCode>tabarra</InlineCode> in October 18, 2003.</span>
        </Label>
        <Textarea
            placeholder="Type your notes about the player."
            id="playerNotes"
            className="w-full mt-1 bg-black/10 dark:bg-black/40"
        />
    </>
}

export default function InfoTab() {
    return <div>
        <h3 className="text-xl pb-2">Player Information</h3>

        <dl className="pb-2">
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Session Time</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">5 hours, 43 minutes</dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Play Time</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">18 days, 21 hours</dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Joined</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">20 December 2022</dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Whitelisted</dt>
                <dd className="text-sm leading-6 mt-0">
                    not yet
                </dd>
                <dd className="text-right">
                    <Button
                        variant="outline"
                        size='inline'
                        style={{minWidth: '8ch'}}
                        onClick={() => { }}
                    >Add WL</Button>
                </dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Log</dt>
                <dd className="text-sm leading-6 mt-0 space-x-2">
                    <LogActionCounter type="Ban" count={12} />
                    <LogActionCounter type="Warn" count={2} />
                </dd>
                <dd className="text-right">
                    <Button
                        variant="outline"
                        size='inline'
                        style={{minWidth: '8ch'}}
                        onClick={() => { }}
                    >View</Button>
                </dd>
            </div>
        </dl>

        <PlayerNotesBox />
    </div>;
}
