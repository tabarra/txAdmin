import MainPageLink from '@/components/MainPageLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Box, ChevronRightSquare, Dna, Eye, FileEdit, LayoutDashboard } from 'lucide-react';
import { useRoute } from 'wouter';

//Separate component to prevent re-render of the entire menu
function ServerName() {
    // FIXME: make data dynamic
    const serverName = '{{serverName}}';
    return serverName;
}

type ServerMenuLinkProps = {
    href: string;
    children: React.ReactNode;
    className?: string;
};
function ServerMenuLink({ href, children, className }: ServerMenuLinkProps) {
    const [isActive] = useRoute(href);
    return (
        <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start py-1" asChild={true}>
            <MainPageLink
                href={href}
                isActive={isActive}
                className={className}
            >
                {children}
            </MainPageLink>
        </Button>
    );
}

export function ServerSidebar() {
    return (
        <aside
            className={cn(
                "self-start sticky top-[calc(4.5rem+1px)] z-0 w-sidebar flex-col gap-4",
                // showServer ? 'block' : 'hidden lg:flex', //FIXME:
                'hidden lg:flex',
            )}
        >
            <div className='rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4'>
                <h2 className="mb-1.5 text-lg font-semibold tracking-tight overflow-hidden text-ellipsis">
                    <ServerName />
                </h2>
                <div className="space-y-1">
                    <ServerMenuLink href="/">
                        <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
                    </ServerMenuLink>
                    <ServerMenuLink href="/server/console">
                        <ChevronRightSquare className="mr-2 h-4 w-4" />Live Console
                    </ServerMenuLink>
                    <ServerMenuLink href="/server/resources">
                        <Box className="mr-2 h-4 w-4" />Resources
                    </ServerMenuLink>
                    <ServerMenuLink href="/server/server-log">
                        <Eye className="mr-2 h-4 w-4" />Server Log
                    </ServerMenuLink>
                    <ServerMenuLink href="/server/cfg-editor">
                        <FileEdit className="mr-2 h-4 w-4" />CFG Editor
                    </ServerMenuLink>
                    {window.txConsts.showAdvanced && (
                        <ServerMenuLink href="/advanced" className='text-yellow-700 dark:text-yellow-200'>
                            <Dna className="mr-2 h-4 w-4" />Advanced
                        </ServerMenuLink>
                    )}
                    <ServerMenuLink href="/test" className='text-yellow-700 dark:text-yellow-200'>
                        <Dna className="mr-2 h-4 w-4" />Test
                    </ServerMenuLink>
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
