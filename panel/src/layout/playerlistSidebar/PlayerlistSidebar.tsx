import { playerCountAtom } from '@/hooks/playerlist';
import { cn } from '@/lib/utils';
import { useAtomValue } from 'jotai';

type PlayerSidebarProps = {
    isSheet?: boolean;
};
export function PlayerlistSidebar({ isSheet }: PlayerSidebarProps) {
    const playerCount = useAtomValue(playerCountAtom);
    return (
        <aside
            className={cn(
                'flex flex-col gap-4',
                isSheet ? 'mr-4 pl-2' : 'tx-sidebar hidden xl:flex',
            )}

            style={{
                //3.5rem-1px-2rem = header - border - y-padding
                height: isSheet ? 'unset' : 'calc(100vh - 3.5rem - 1px - 2rem)',
            }}
        >
            <div className="flex justify-center items-center h-[211px]
            text-3xl font-extralight text-center tracking-wider
            rounded-xl border border-border bg-card text-card-foreground shadow-sm"
            >
                PLAYERS: {playerCount}
            </div>
            <div className={cn(
                !isSheet && 'rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4',
                'flex flex-col gap-4',
                'flex-growx overflow-y-scroll h-[500px]x max-h-screen'
            )}>
                Lorem ipsum dolor si
                t amet, consectetu
                r adipiscing elit,
                sed do eiusmod te
                mpor incididunt ut
                labore et dolore
                magna aliqua. Ut
                enim ad minim veniam, quis
                nostrud exercitat
                ion ullamco labor
                is nisi ut aliquip
                ex ea commodo consequat.
                PLAYERLIST
                Lorem ipsum dolor si
                t amet, consectetu
                r adipiscing elit,
                sed do eiusmod te
                mpor incididunt ut
                labore et dolore
                magna aliqua. Ut
                enim ad minim veniam, quis
                nostrud exercitat
                ion ullamco labor
                is nisi ut aliquip
                ex ea commodo consequat.
                PLAYERLIST
                Lorem ipsum dolor si
                t amet, consectetu
                r adipiscing elit,
                sed do eiusmod te
                mpor incididunt ut
                labore et dolore
                magna aliqua. Ut
                enim ad minim veniam, quis
                nostrud exercitat
                ion ullamco labor
                is nisi ut aliquip
                ex ea commodo consequat.
                Lorem ipsum dolor si
                t amet, consectetu
                r adipiscing elit,
                sed do eiusmod te
                mpor incididunt ut
                labore et dolore
                magna aliqua. Ut
                enim ad minim veniam, quis
                nostrud exercitat
                ion ullamco labor
                is nisi ut aliquip
                ex ea commodo consequat.
                PLAYERLIST
                Lorem ipsum dolor si
                t amet, consectetu
                r adipiscing elit,
                sed do eiusmod te
                mpor incididunt ut
                labore et dolore
                magna aliqua. Ut
                enim ad minim veniam, quis
                nostrud exercitat
                ion ullamco labor
                is nisi ut aliquip
                ex ea commodo consequat.
                PLAYERLIST
                Lorem ipsum dolor si
                t amet, consectetu
                r adipiscing elit,
                sed do eiusmod te
                mpor incididunt ut
                labore et dolore
                magna aliqua. Ut
                enim ad minim veniam, quis
                nostrud exercitat
                ion ullamco labor
                is nisi ut aliquip
                ex ea commodo consequat.
            </div>
        </aside>
    );
}
