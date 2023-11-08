import { cn } from '@/lib/utils';

export function PlayersSidebar() {
    return (
        <aside
            className={cn(
                "self-start sticky top-[calc(4.5rem+1px)] z-0 w-sidebar flex-col gap-4",
                // showPlayerlist ? 'block' : 'hidden xl:flex',
                'hidden xl:flex',
            )}
        >
            <div className="flex justify-center items-center h-[211px]
            text-3xl font-extralight text-center tracking-wider
            rounded-xl border border-border bg-card text-card-foreground shadow-sm"
            >
                PLAYER CNT
            </div>
            <div className="flex justify-center items-center h-[500px]
                text-3xl font-extralight text-center tracking-wider 
                rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                PLAYERLIST
            </div>
        </aside>
    );
}
