import * as React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useRoute } from 'wouter';
import MainPageLink from '@/components/MainPageLink';


type HeaderMenuLinkProps = {
    href: string;
    children: React.ReactNode;
    className?: string;
};
function HeaderMenuLink(props: HeaderMenuLinkProps) {
    const [isActive] = useRoute(props.href);
    return (
        <NavigationMenuItem>
            <NavigationMenuLink asChild active={isActive}>
                <MainPageLink
                    href={props.href}
                    isActive={isActive}
                    className={cn(
                        navigationMenuTriggerStyle(),
                        props.className,
                    )}
                >
                    {props.children}
                </MainPageLink>
            </NavigationMenuLink>
        </NavigationMenuItem>
    );
}


//NOTE: breaking NavigationMenuItem into a separate menu because the dropdown is positioned wrong otherwise
export default function DesktopHeader() {
    return (
        <div className='space-x-1 flex flex-row'>
            <NavigationMenu>
                <NavigationMenuList>
                    <HeaderMenuLink href="/players">Players</HeaderMenuLink>
                    <HeaderMenuLink href="/history" className='text-fuchsia-400'>History</HeaderMenuLink>
                    <HeaderMenuLink href="/whitelist">Whitelist</HeaderMenuLink>
                    <HeaderMenuLink href="/admins">Admins</HeaderMenuLink>
                    <HeaderMenuLink href="/settings">Settings</HeaderMenuLink>
                </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>System</NavigationMenuTrigger>
                        <NavigationMenuContent asChild={true}>
                            <div className="flex flex-col gap-2 p-4">
                                <HeaderMenuLink
                                    className="w-36 justify-start"
                                    href="/system/master-actions"
                                >
                                    Master Actions
                                </HeaderMenuLink>
                                <HeaderMenuLink
                                    className="w-36 justify-start"
                                    href="/system/diagnostics"
                                >
                                    Diagnostics
                                </HeaderMenuLink>
                                <HeaderMenuLink
                                    className="w-36 justify-start"
                                    href="/system/console-log"
                                >
                                    Console Log
                                </HeaderMenuLink>
                                <HeaderMenuLink
                                    className="w-36 justify-start"
                                    href="/system/action-log"
                                >
                                    Action Log
                                </HeaderMenuLink>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
}
