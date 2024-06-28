import { Loader2Icon, OctagonXIcon } from "lucide-react";

type PlayerDropsLoadingSpinnerProps = {
    isError?: boolean;
};
export function PlayerDropsLoadingSpinner({ isError }: PlayerDropsLoadingSpinnerProps) {
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-destructive-inline">
                <OctagonXIcon className="size-16 opacity-75" />
                <span>Error loading data.</span>
            </div>
        );
    } else {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
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
        <div className="px-4 py-6 text-center text-xl tracking-wider text-muted-foreground/75">
            {message}
        </div>
    )
}
