import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
};

export default function InlineCode({ children, className, ...props }: Props) {
    return (
        <code
            className={cn("rounded-sm font-mono text-muted-foreground bg-muted px-[0.25rem]", className)}
            {...props}
        >
            {children}
        </code>
    );
}
