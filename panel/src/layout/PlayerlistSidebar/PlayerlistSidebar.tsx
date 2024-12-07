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
                'flex flex-col z-10',
                isSheet ? 'w-full h-screen' : 'tx-sidebar hidden xl:flex gap-4 h-contentvh',
            )}
        >
            <div
                className={cn(
                    'text-card-foreground shrink-0 p-4',
                    isSheet ? 'pr-12 border-b' : 'rounded-xl border bg-card',
                )}
            >
                <PlayerlistSummary />
            </div>
            <div
                className={cn(
                    'flex flex-col gap-2 flex-grow overflow-hidden',
                    !isSheet && 'min-h-[480px] rounded-xl border bg-card text-card-foreground shadow-sm',
                )}
            >
                <Playerlist />
            </div>
        </aside>
    );
}
