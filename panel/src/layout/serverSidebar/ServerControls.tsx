import KickAllIcon from '@/components/KickAllIcon';
import { processInstantiatedAtom } from '@/hooks/status';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { useAtomValue } from 'jotai';
import { MegaphoneIcon, PowerIcon, PowerOffIcon, RotateCcwIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOpenConfirmDialog, useOpenPromptDialog } from '@/hooks/dialogs';


const tooltipDelay = 300;

const controlButtonsVariants = cva(
    `h-10 sm:h-8 rounded-md transition-colors
    flex flex-grow items-center justify-center flex-shrink-0
    border bg-muted shadow-md

    focus:outline-none disabled:pointer-events-none disabled:opacity-50 ring-offset-background  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`,
    {
        variants: {
            type: {
                default: "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                destructive: "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
                warning: "hover:bg-warning hover:text-warning-foreground hover:border-warning",
                success: "hover:bg-success hover:text-success-foreground hover:border-success",
                info: "hover:bg-info hover:text-info-foreground hover:border-info",
            },
        },
        defaultVariants: {
            type: "default",
        },
    }
);

export default function ServerControls({ isSheet }: { isSheet?: boolean }) {
    const processInstantiated = useAtomValue(processInstantiatedAtom);
    const openConfirmDialog = useOpenConfirmDialog();
    const openPromptDialog = useOpenPromptDialog();

    const handleStartStop = () => {
        alert('FIXME: Start/stop');
    }
    const handleRestart = () => {
        if (!processInstantiated) return;
        openConfirmDialog({
            title: 'Restart Server',
            message: 'Are you sure you want to restart the server?',
            onConfirm: () => {
                // alert('FIXME: restart');
            },
        });
    }
    const handleAnnounce = () => {
        if (!processInstantiated) return;
        openPromptDialog({
            title: 'Send Announcement',
            message: 'Type the message to be broadcasted to all players.',
            placeholder: 'the event will start in xxx minutes!',
            submitLabel: 'Send',
            required: true,
            onSubmit: (input) => {
                alert(`Announcement: ${input}`);
            }
        });
    }
    const handleKickAll = () => {
        if (!processInstantiated) return;
        alert('FIXME: KickAll');
    }

    return (
        <TooltipProvider delayDuration={tooltipDelay} disableHoverableContent={true} >
            <div className="flex flex-row justify-between gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        {processInstantiated
                            ? <button
                                onClick={handleStartStop}
                                className={controlButtonsVariants({ type: 'destructive' })}
                            >
                                <PowerOffIcon className='h-5' />
                            </button>
                            : <div className="relative flex flex-grow h-8">
                                <div className='absolute inset-0 bg-success animate-pulse rounded blur-sm'></div>
                                <button
                                    onClick={handleStartStop}
                                    className={cn(controlButtonsVariants({ type: 'success' }), 'relative')}
                                >
                                    <PowerIcon className='h-5' />
                                </button>
                            </div>
                        }
                    </TooltipTrigger>
                    <TooltipContent className='max-w-md flex-wrap'>
                        <p>{processInstantiated ? 'Stop the server' : 'Start the server! 🚀'}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleRestart}
                            className={cn(controlButtonsVariants({ type: 'warning' }))}
                            disabled={!processInstantiated}
                        >
                            <RotateCcwIcon className='h-5' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Restart Server</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleAnnounce}
                            className={controlButtonsVariants()}
                            disabled={!processInstantiated}
                        >
                            <MegaphoneIcon className='h-5' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Send Announcement</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={handleKickAll}
                            className={controlButtonsVariants()}
                            disabled={!processInstantiated}
                        >
                            <KickAllIcon style={{ height: '1.25rem', width: '1.5rem', fill: 'currentcolor' }} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Kick All Players</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
