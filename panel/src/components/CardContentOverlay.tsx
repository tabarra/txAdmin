import { Loader2Icon, OctagonXIcon } from "lucide-react";

type CardContentOverlayProps = {
    loading?: boolean;
    error?: React.ReactNode;
    message?: React.ReactNode;
};
export default function CardContentOverlay({ loading, error, message }: CardContentOverlayProps) {
    let innerNode: React.ReactNode;
    if (loading) {
        innerNode = (
            <Loader2Icon className="animate-spin size-20 opacity-75" />
        )
    } else if (error) {
        innerNode = (
            <>
                <OctagonXIcon className="size-16 opacity-75 text-destructive-inline" />
                <span className='max-w-4xl text-xl text-destructive-inline'>{error}</span>
            </>
        )
    } else if (message) {
        innerNode = (
            <span className="max-w-4xl text-2xl tracking-wider text-muted-foreground/75">
                {message}
            </span>
        )
    } else {
        return null;
    }
    return (
        <div className="absolute inset-0 z-10 min-h-20 px-4 py-6 rounded-[inherit] dark:bg-black/25 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-center">
            {innerNode}
        </div>
    )
}
