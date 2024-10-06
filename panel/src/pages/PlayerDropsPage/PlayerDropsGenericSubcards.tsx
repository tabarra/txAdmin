import { Loader2Icon, OctagonXIcon } from "lucide-react";

type PlayerDropsLoadingSpinnerProps = {
    isError?: boolean;
};
export function PlayerDropsLoadingSpinner({ isError }: PlayerDropsLoadingSpinnerProps) {
    if (isError) {
        return (
            <div className="h-full min-h-28 flex flex-col items-center justify-center gap-2 text-destructive-inline">
                <OctagonXIcon className="size-16 opacity-75" />
                <span>Error loading data.</span>
            </div>
        );
    } else {
        return (
            <div className="h-full min-h-28 flex items-center justify-center text-muted-foreground">
                <Loader2Icon className="animate-spin size-16 opacity-75" />
            </div>
        );
    }
}

type PlayerDropsMessageProps = {
    message: string;
};
export function PlayerDropsMessage({ message }: PlayerDropsMessageProps) {
    return (
        <div className="h-full min-h-28 px-4 py-6 flex items-center justify-center text-xl tracking-wider text-muted-foreground/75">
            {message}
        </div>
    )
}
