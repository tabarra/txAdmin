import { cn, openExternalLink } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function TxAnchor({ children, href, className, rel, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    const setLocation = useLocation()[1];
    const isExternal = href?.startsWith('http');
    const onClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (!href) return;
        e.preventDefault();
        if (isExternal) {
            openExternalLink(href);
        } else {
            setLocation(href ?? '/');
        }
    }
    return (
        <a
            {...rest}
            rel={rel ?? 'noopener noreferrer'}
            href={href}
            className={cn("text-accent no-underline hover:underline ml-1 mr-0 cursor-pointer", className)}
            onClick={onClick}
        >
            {children}
            {isExternal &&
                <ExternalLinkIcon
                    className="inline ml-1 mb-1 h-5 [.text-sm_&]:h-4 [.text-sm_&]:ml-0"
                />}
        </a>
    );
}
