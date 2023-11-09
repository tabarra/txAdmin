import { pageErrorStatusAtom, useContentRefresh } from "@/hooks/mainPageStatus";
import { useAtomValue } from "jotai";
import { forwardRef } from "react";
import { Link } from "wouter";

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
    const checkOnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
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
