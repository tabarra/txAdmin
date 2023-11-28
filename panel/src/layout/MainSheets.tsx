import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ServerSidebar } from "./serverSidebar/ServerSidebar";
import { useGlobalMenuSheet, usePlayerlistSheet, useServerSheet } from "@/hooks/sheets";
import { MenuNavLink } from "@/components/MainPageLink";
import { ClipboardCheckIcon, ListIcon, PieChartIcon, ScrollIcon, SettingsIcon, UserSquare2Icon, UsersIcon, ZapIcon } from 'lucide-react';
import { PlayersSidebar } from "./PlayersSidebar";


export function GlobalMenuSheet() {
    const { isSheetOpen, setIsSheetOpen } = useGlobalMenuSheet();
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side='left' className="flex flex-col gap-6 w-full xs:w-3/4">
                <SheetHeader>
                    <SheetTitle><span className="h-7 w-36 bg-accent text-accent-foreground rounded text-center p-0.5 font-bold tracking-widest">FULL LOGO</span></SheetTitle>
                </SheetHeader>

                <div>
                    <h2 className="mb-1.5 text-lg font-semibold tracking-tight">
                        Global Menu
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <MenuNavLink href="/players">
                            <UsersIcon className="mr-2 h-4 w-4" />Players
                        </MenuNavLink>
                        <MenuNavLink href="/history" className="text-accent">
                            <ScrollIcon className="mr-2 h-4 w-4" />History
                        </MenuNavLink>
                        <MenuNavLink href="/whitelist">
                            <ClipboardCheckIcon className="mr-2 h-4 w-4" />Whitelist
                        </MenuNavLink>
                        <MenuNavLink href="/admins">
                            <UserSquare2Icon className="mr-2 h-4 w-4" />Admins
                        </MenuNavLink>
                        <MenuNavLink href="/settings">
                            <SettingsIcon className="mr-2 h-4 w-4" />Settings
                        </MenuNavLink>
                    </div>
                </div>
                <div>
                    <h2 className="mb-1.5 text-lg font-semibold tracking-tight">
                        System Menu
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <MenuNavLink href="/system/master-actions">
                            <ZapIcon className="mr-2 h-4 w-4" />Master Actions
                        </MenuNavLink>
                        <MenuNavLink href="/system/diagnostics">
                            <PieChartIcon className="mr-2 h-4 w-4" />Diagnostics
                        </MenuNavLink>
                        <MenuNavLink href="/system/console-log">
                            <ListIcon className="mr-2 h-4 w-4" />Console Log
                        </MenuNavLink>
                        <MenuNavLink href="/system/action-log">
                            <ListIcon className="mr-2 h-4 w-4" />Action Log
                        </MenuNavLink>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export function ServerSidebarSheet() {
    const { isSheetOpen, setIsSheetOpen } = useServerSheet();
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side='left' className="w-full xs:w-3/4">
                <ScrollArea className="h-full">
                    <ServerSidebar isSheet />
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export function PlayersSidebarSheet() {
    const { isSheetOpen, setIsSheetOpen } = usePlayerlistSheet();
    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side='right' className="w-full xs:w-3/4">
                <ScrollArea className="h-full">
                    <PlayersSidebar isSheet />
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export default function MainSheets() {
    return <>
        <GlobalMenuSheet />
        <ServerSidebarSheet />
        <PlayersSidebarSheet />
    </>;
}
