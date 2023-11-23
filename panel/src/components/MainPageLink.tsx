import { useSheets } from "@/hooks/sheets";
import { pageErrorStatusAtom, useContentRefresh } from "@/hooks/pages";
import { useAtomValue } from "jotai";
import { forwardRef } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "./ui/button";

type MainPageLinkProps = {
    isActive?: boolean;
    href: string;
    children: React.ReactNode;
    className?: string;
};
function MainPageLinkInner(
    props: MainPageLinkProps,
    ref: React.ForwardedRef<HTMLAnchorElement>
) {
    const isPageInError = useAtomValue(pageErrorStatusAtom);
    const refreshContent = useContentRefresh();
    const { closeAllSheets } = useSheets();
    const checkOnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
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
};
export function MenuNavLink({ href, children, className }: MenuNavProps) {
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
