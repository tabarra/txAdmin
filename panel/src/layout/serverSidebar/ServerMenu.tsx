import { MenuNavLink } from '@/components/MainPageLink';
import { useAdminPerms } from '@/hooks/auth';
import { serverNameAtom } from '@/hooks/status';
import { useAtomValue } from 'jotai';
import { Box, ChevronRightSquare, Dna, Eye, FileEdit, LayoutDashboard } from 'lucide-react';


//Separate component to prevent re-render of the entire menu
function ServerName() {
    return useAtomValue(serverNameAtom);
}

export default function ServerMenu() {
    const { hasPerm } = useAdminPerms();

    return <>
        <h2 className="mb-1.5 text-lg font-semibold tracking-tight overflow-hidden text-ellipsis">
            <ServerName />
        </h2>
        <div className="space-y-1 select-none">
            <MenuNavLink href="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
            </MenuNavLink>
            <MenuNavLink href="/server/console" disabled={!hasPerm('console.view')}>
                <ChevronRightSquare className="mr-2 h-4 w-4" />Live Console
            </MenuNavLink>
            <MenuNavLink href="/server/resources">
                <Box className="mr-2 h-4 w-4" />Resources
            </MenuNavLink>
            <MenuNavLink href="/server/server-log">
                <Eye className="mr-2 h-4 w-4" />Server Log
            </MenuNavLink>
            <MenuNavLink href="/server/cfg-editor" disabled={!hasPerm('server.cfg.editor')}>
                <FileEdit className="mr-2 h-4 w-4" />CFG Editor
            </MenuNavLink>
            {window.txConsts.showAdvanced && (
                <MenuNavLink href="/advanced" className='text-accent' disabled={!hasPerm('all_permisisons')}>
                    <Dna className="mr-2 h-4 w-4" />Advanced
                </MenuNavLink>
            )}
            <MenuNavLink href="/test" className='text-accent'>
                <Dna className="mr-2 h-4 w-4" />Test
            </MenuNavLink>
        </div>
    </>
}
