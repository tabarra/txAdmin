import { MenuNavLink } from '@/components/MainPageLink';
import { cn } from '@/lib/utils';
import { Box, ChevronRightSquare, Dna, Eye, FileEdit, LayoutDashboard } from 'lucide-react';

//Separate component to prevent re-render of the entire menu
function ServerName() {
    // FIXME: make data dynamic
    const serverName = '{{serverName}}';
    return serverName;
}


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
            <div
                className={cn(
                    !isSheet && 'rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4',
                )}
            >
                <h2 className="mb-1.5 text-lg font-semibold tracking-tight overflow-hidden text-ellipsis">
                    <ServerName />
                </h2>
                <div className="space-y-1">
                    <MenuNavLink href="/">
                        <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
                    </MenuNavLink>
                    <MenuNavLink href="/server/console">
                        <ChevronRightSquare className="mr-2 h-4 w-4" />Live Console
                    </MenuNavLink>
                    <MenuNavLink href="/server/resources">
                        <Box className="mr-2 h-4 w-4" />Resources
                    </MenuNavLink>
                    <MenuNavLink href="/server/server-log">
                        <Eye className="mr-2 h-4 w-4" />Server Log
                    </MenuNavLink>
                    <MenuNavLink href="/server/cfg-editor">
                        <FileEdit className="mr-2 h-4 w-4" />CFG Editor
                    </MenuNavLink>
                    {window.txConsts.showAdvanced && (
                        <MenuNavLink href="/advanced" className='text-accent'>
                            <Dna className="mr-2 h-4 w-4" />Advanced
                        </MenuNavLink>
                    )}
                    <MenuNavLink href="/test" className='text-accent'>
                        <Dna className="mr-2 h-4 w-4" />Test
                    </MenuNavLink>
                </div>
            </div>
            <div className="flex justify-center items-center h-[246px]
                text-3xl font-extralight text-center tracking-wider
                rounded-xl border border-border bg-card text-card-foreground shadow-sm"
            >
                STATUS
            </div>
            <div className="flex justify-center items-center h-[80px]
                text-3xl font-extralight text-center tracking-wider
                rounded-xl border border-border bg-card text-card-foreground shadow-sm"
            >
                ZAP AD
            </div>
        </aside>
    );
}
