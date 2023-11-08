import { pageErrorStatusAtom, useContentRefresh } from "@/hooks/mainPageStatus";
import { useAtomValue } from "jotai";
import { Link } from "wouter";

type MainPageLinkProps = {
    isActive?: boolean;
    href: string;
    children: React.ReactNode;
    className?: string;
};
export default function MainPageLink({ href, children, className, isActive }: MainPageLinkProps) {
    const isPageInError = useAtomValue(pageErrorStatusAtom);
    const refreshContent = useContentRefresh();
    const checkOnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (isActive || isPageInError) {
            console.log('Page is already active or in error state. Forcing error boundry + router re-render.');
            refreshContent();
            e.preventDefault();
        }
    }

    return (
        <Link href={href} onClick={checkOnClick} className={className}>
            {children}
        </Link>
    );
}
