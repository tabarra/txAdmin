import { cn } from '@/lib/utils';
import ServerMenu from './ServerMenu';
import ServerControls from './ServerControls';
import ServerStatus from './ServerStatus';
import ServerSchedule from './ServerSchedule';


type ServerSidebarProps = {
    isSheet?: boolean;
};
export function ServerSidebar({ isSheet }: ServerSidebarProps) {
    return (
        <aside
            className={cn(
                'flex flex-col gap-4',
                isSheet
                    ? 'mr-4'
                    : "self-start sticky top-[calc(4.5rem+1px)] z-0 w-sidebar shrink-0 hidden lg:flex",
            )}
        >
            <div className={cn(
                !isSheet && 'rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4',
            )}>
                <ServerMenu />
            </div>
            <hr className={isSheet ? 'block' : 'hidden'} />
            <div className={cn(
                !isSheet && 'rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4',
                'flex flex-col gap-4'
            )}>
                <ServerControls isSheet />
                <ServerStatus />
                <ServerSchedule />
            </div>
            <hr className={isSheet ? 'block' : 'hidden'} />
            <div className="flex justify-center items-center h-[80px]
                text-3xl font-extralight text-center tracking-wider
                rounded-xl border border-border bg-card text-card-foreground shadow-sm"
            >
                ZAP AD
            </div>
        </aside>
    );
}
