import { useState, type AnimationEventHandler, type ReactNode } from 'react';
import { AlertCircleIcon, AlertOctagonIcon, CheckCircleIcon, ChevronRightCircle, InfoIcon, XIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


export const validTxAlertTypes = ['default', 'info', 'success', 'warning', 'error'] as const;
export type TxAlertType = typeof validTxAlertTypes[number];

type TxAlertBaseProps = {
    children: ReactNode;
    type?: TxAlertType;
    ariaLabel?: string;
    className?: string;
};

type TxAlertProps = TxAlertBaseProps & (
    | {
        onDismiss?: undefined;
        dismissTooltip?: undefined;
    }
    | {
        onDismiss: () => void;
        dismissTooltip?: string;
    }
);

type TxAlertInnerProps = TxAlertBaseProps & {
    action?: ReactNode;
    isLeaving?: boolean;
    onAnimationEnd?: AnimationEventHandler<HTMLDivElement>;
};

type DismissibleTxAlertProps = TxAlertBaseProps & {
    onDismiss: () => void;
    dismissTooltip?: string;
};

const txAlertVariants = cva(
    `relative isolate w-fit max-w-full self-center overflow-hidden rounded-md
    border border-l-4 shadow-sm text-black/75 dark:text-white/90
    [&_a]:font-semibold`,
    {
        variants: {
            type: {
                default: "border-primary/75 dark:border-primary/35 border-l-muted-foreground/75 dark:border-l-muted-foreground/25 bg-white dark:bg-secondary dark:text-secondary-foreground [&_a]:text-accent",
                info: "border-info/75 dark:border-info/35 border-l-info bg-info-hint [&_a]:text-info-inline",
                success: "border-success/75 dark:border-success/35 border-l-success bg-success-hint [&_a]:text-success-inline",
                warning: "border-warning/75 dark:border-warning/35 border-l-warning bg-warning-hint [&_a]:text-warning-inline",
                error: "border-destructive/75 dark:border-destructive/35 border-l-destructive bg-destructive-hint [&_a]:text-destructive-inline",
            },
        },
        defaultVariants: {
            type: 'default',
        },
    }
);

const txAlertIconMap = {
    default: <ChevronRightCircle className="mt-0.5 size-5 shrink-0 stroke-muted-foreground animate-toastbar-icon sm:mt-0" aria-hidden="true" />,
    info: <InfoIcon className="mt-0.5 size-5 shrink-0 stroke-info animate-toastbar-icon sm:mt-0" aria-hidden="true" />,
    success: <CheckCircleIcon className="mt-0.5 size-5 shrink-0 stroke-success animate-toastbar-icon sm:mt-0" aria-hidden="true" />,
    warning: <AlertCircleIcon className="mt-0.5 size-5 shrink-0 stroke-warning animate-toastbar-icon sm:mt-0" aria-hidden="true" />,
    error: <AlertOctagonIcon className="mt-0.5 size-5 shrink-0 stroke-destructive animate-toastbar-icon sm:mt-0" aria-hidden="true" />,
} as const;

const txAlertDismissVariantMap = {
    default: 'ghost-muted',
    info: 'ghost-info',
    success: 'ghost-success',
    warning: 'ghost-warning',
    error: 'ghost-destructive',
} as const;

function TxAlertInner({
    children,
    type = 'default',
    ariaLabel,
    className,
    action,
    isLeaving = false,
    onAnimationEnd,
}: TxAlertInnerProps) {
    return (
        <div
            role="status"
            aria-label={ariaLabel}
            onAnimationEnd={onAnimationEnd}
            className={cn(
                txAlertVariants({ type }),
                isLeaving ? 'animate-toastbar-leave' : 'animate-toastbar-enter',
                className
            )}
        >
            <div className={cn(
                'flex items-start gap-3 py-2.5 pl-3 sm:items-center',
                action ? 'pr-11' : 'pr-3'
            )}>
                {txAlertIconMap[type]}
                <div className="min-w-0 text-sm leading-5 text-foreground/80">
                    {children}
                </div>
            </div>

            {action}
        </div>
    );
}

function DismissibleTxAlert({
    onDismiss,
    dismissTooltip = 'Dismiss alert',
    type = 'default',
    ...props
}: DismissibleTxAlertProps) {
    const [isLeaving, setIsLeaving] = useState(false);

    const finishDismissal: AnimationEventHandler<HTMLDivElement> = (event) => {
        if (event.currentTarget === event.target && isLeaving) {
            onDismiss();
        }
    };

    return (
        <Tooltip>
            <TxAlertInner
                {...props}
                type={type}
                isLeaving={isLeaving}
                onAnimationEnd={finishDismissal}
                action={(
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant={txAlertDismissVariantMap[type]}
                            size="icon"
                            className="absolute right-2 top-1/2 size-7 -translate-y-1/2 rounded-full"
                            aria-label={dismissTooltip}
                            onClick={() => setIsLeaving(true)}
                        >
                            <XIcon className="size-4" aria-hidden="true" />
                        </Button>
                    </TooltipTrigger>
                )}
            />
            <TooltipContent>
                {dismissTooltip}
            </TooltipContent>
        </Tooltip>
    );
}

export default function TxAlert({ onDismiss, dismissTooltip, ...props }: TxAlertProps) {
    if (onDismiss === undefined) {
        return <TxAlertInner {...props} />;
    }

    return (
        <DismissibleTxAlert
            {...props}
            onDismiss={onDismiss}
            dismissTooltip={dismissTooltip}
        />
    );
}
