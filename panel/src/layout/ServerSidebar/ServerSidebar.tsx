import { cn } from '@/lib/utils';
import { handleExternalLinkClick } from "@/lib/navigation";
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
                'flex flex-col gap-4 z-10',
                isSheet ? 'px-4 py-6' : 'tx-sidebar hidden lg:flex',
            )}
        >
            <div className={cn(
                !isSheet && 'rounded-xl border bg-card text-card-foreground shadow-sm p-4',
            )}>
                <ServerMenu />
            </div>
            <hr className={isSheet ? 'block' : 'hidden'} />
            <div className={cn(
                !isSheet && 'rounded-xl border bg-card text-card-foreground shadow-sm p-4',
                'flex flex-col gap-4'
            )}>
                {/* <h2 className="text-lg font-semibold tracking-tight overflow-hidden text-ellipsis">
                    Controls & Status
                </h2> */}
                <ServerControls />
                <ServerStatus />
                <ServerSchedule />
            </div>
            <hr className={isSheet ? 'block' : 'hidden'} />

            {window.txConsts.adsData.main ? (
                <a
                    href={window.txConsts.adsData.main.url}
                    onClick={handleExternalLinkClick}
                    target='_blank'
                    className='w-sidebar h-[80px] relative self-center group shadow-sm opacity-80 hover:opacity-100
                    dark:brightness-90 dark:hover:brightness-100'
                >
                    <div className='absolute inset-0 -z-10 animate-pulse blur 
                    scale-0 group-hover:scale-100 transition-transform bg-black
                    dark:bg-gradient-to-r dark:from-[#18E889] dark:to-[#01FFFF]' />
                    <img
                        className='rounded-xl max-w-sidebar max-h-[80px] m-auto'
                        src={window.txConsts.adsData.main.img}
                    />
                </a>
            ) : null}

            {window.txConsts.isWebInterface ? (
                <div className='flex flex-col items-center justify-center gap-1 text-sm font-light opacity-85 hover:opacity-100'>
                    <span className={cn(
                        'text-muted-foreground',
                        window.txConsts.txaVersion.includes('-') && 'text-destructive-inline font-semibold',
                    )}>
                        tx: <strong>v{window.txConsts.txaVersion}</strong>
                        &nbsp;|
                        fx: <strong>b{window.txConsts.fxsVersion}</strong>
                    </span>
                    <a
                        href="https://github.com/tabarra/txAdmin/blob/master/LICENSE"
                        onClick={handleExternalLinkClick}
                        target="_blank"
                        className='text-muted-foreground hover:text-accent'
                    >
                        &copy; 2019-{(new Date).getUTCFullYear()} Tabarra
                    </a>
                </div>
            ) : null}
        </aside>
    );
}
