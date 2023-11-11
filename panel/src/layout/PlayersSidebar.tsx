import { cn } from '@/lib/utils';

type PlayerSidebarProps = {
    isSheet?: boolean;
};
export function PlayersSidebar({ isSheet }: PlayerSidebarProps) {
    return (
        <aside
            className={cn(
                'flex flex-col gap-4',
                isSheet
                    ? 'mr-4'
                    : "self-start sticky top-[calc(4.5rem+1px)] z-0 w-sidebar shrink-0 hidden xl:flex",
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
