import { cn, handleExternalLinkClick } from '@/lib/utils';
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
                isSheet ? 'mr-4 pl-2' : 'tx-sidebar hidden lg:flex',
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
                <ServerControls />
                <ServerStatus />
                <ServerSchedule />
            </div>
            <hr className={isSheet ? 'block' : 'hidden'} />

            {/* Ad Placeholder */}
            {/* FIXME: add it back */}
            <a
                href='http://zap-hosting.com/txAdmin5'
                onClick={handleExternalLinkClick}
                target='_blank'
                className='h-[80px] p-4 DEBUGflex justify-center items-center gap-2
                rounded-xl border shadow-sm
                bg-gradient-to-r from-yellow-200 via-green-200 to-green-300
                dark:brightness-90 dark:hover:brightness-100
                relative group hidden'
            >
                <div className='scale-0 group-hover:scale-100 transition-transform
                absolute inset-0 animate-pulse blur-md -z-10
                bg-black
                dark:bg-gradient-to-r dark:from-yellow-200 dark:via-green-200 dark:to-green-300' />
                <img
                    className='h-8'
                    src="img/zap256_black.png"
                />
                <p className='text-xs text-zinc-900 text-center tracking-wide'>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
                </p>
            </a>
        </aside>
    );
}
