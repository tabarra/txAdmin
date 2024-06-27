import { cn } from '@/lib/utils';
import PlayerlistSummary from './PlayerlistSummary';
import Playerlist from './Playerlist';


type PlayerSidebarProps = {
    isSheet?: boolean;
};
export function PlayerlistSidebar({ isSheet }: PlayerSidebarProps) {
    return (
        <aside
            className={cn(
                'flex flex-col gap-4 z-10',
                isSheet ? 'w-full pr-2' : 'tx-sidebar hidden xl:flex',
            )}
            style={{
                height: isSheet
                    //1.5rem*2 = y-padding
                    ? 'calc(100vh - 3rem)'
                    //3.5rem-1px-2rem = header - border - y-padding
                    : 'calc(100vh - 3.5rem - 1px - 2rem)',
            }}
        >
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm shrink-0 p-4">
            {/* <div className="rounded-xl border border-border bg-cardx text-card-foreground shadow-sm shrink-0 p-4"> */}
                <PlayerlistSummary />
            </div>
            <div
                className={cn(
                    'min-h-[480px]',
                    !isSheet && 'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
                    // !isSheet && 'rounded-xl border border-border bg-cardx text-card-foreground shadow-sm',
                    'flex flex-col gap-2 flex-grow overflow-hidden',
                )}
            >
                <Playerlist />
            </div>
        </aside>
    );
}
