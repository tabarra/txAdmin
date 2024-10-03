import { useCloseAllSheets } from "@/hooks/sheets";
import { pageErrorStatusAtom, useContentRefresh } from "@/hooks/pages";
import { useAtomValue } from "jotai";
import { forwardRef } from "react";
import { Link, useRoute } from "wouter";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";


type MainPageLinkProps = {
    isActive?: boolean;
    href: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
};

function MainPageLinkInner(
    props: MainPageLinkProps,
    ref: React.ForwardedRef<HTMLAnchorElement>
) {
    const isPageInError = useAtomValue(pageErrorStatusAtom);
    const refreshContent = useContentRefresh();
    const closeAllSheets = useCloseAllSheets();
    const checkOnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (props.disabled) {
            e.preventDefault();
            return;
        }
        closeAllSheets();
        if (props.isActive || isPageInError) {
            console.log('Page is already active or in error state. Forcing error boundry + router re-render.');
            refreshContent();
            e.preventDefault();
        }
    }

    return (
        <Link
            // @ts-ignore - idk why this errors
            ref={ref}
            href={props.href}
            onClick={checkOnClick}
            className={props.className}
        >
            {props.children}
        </Link>
    );
}

const MainPageLink = forwardRef(MainPageLinkInner);
export default MainPageLink;


type MenuNavProps = {
    href: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
};

export function MenuNavLink({ href, children, className, disabled }: MenuNavProps) {
    const [isActive] = useRoute(href);
    if (disabled) {
        return (
            <Tooltip>
                <TooltipTrigger className="cursor-help">
                    <Button variant='ghost' className="w-full justify-start py-1" disabled>
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-destructive-inline text-center">
                    You do not have permission <br />
                    to access this page.
                </TooltipContent>
            </Tooltip>
        )
    } else {
        return (
            <MainPageLink
                href={href}
                isActive={isActive}
                className={cn(
                    buttonVariants({ variant: isActive ? 'secondary' : 'ghost' }),
                    'w-full justify-start py-1',
                    className,
                )}
            >
                {children}
            </MainPageLink>
        )
    }
}

type NavLinkProps = {
    href: string;
    children: React.ReactNode;
    className?: string;
};

export function NavLink({ href, children, className }: NavLinkProps) {
    const [isActive] = useRoute(href);

    return (
        <MainPageLink
            href={href}
            isActive={isActive}
            className={className}
        >
            {children}
        </MainPageLink>
    )
}
