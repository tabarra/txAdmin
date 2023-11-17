import * as React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useRoute } from 'wouter';
import MainPageLink from '@/components/MainPageLink';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
    `group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 ring-offset-background  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`,
    {
        variants: {
            variant: {
                default: "hover:bg-primary hover:text-primary-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            },
        },
    }
);

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
                        buttonVariants({ variant: isActive ? 'secondary' : 'default' }),
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
                    <HeaderMenuLink href="/history" className='text-accent'>History</HeaderMenuLink>
                    <HeaderMenuLink href="/whitelist">Whitelist</HeaderMenuLink>
                    <HeaderMenuLink href="/admins">Admins</HeaderMenuLink>
                    <HeaderMenuLink href="/settings">Settings</HeaderMenuLink>
                </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>
                            System
                        </NavigationMenuTrigger>
                        <NavigationMenuContent asChild={true}>
                            <div className="flex flex-col gap-2 p-4 list-none">
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
