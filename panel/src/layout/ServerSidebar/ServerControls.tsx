import { KickAllIcon } from '@/components/KickIcons';
import { processInstantiatedAtom, serverConfigPendingStepAtom } from '@/hooks/status';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { useAtomValue } from 'jotai';
import { MegaphoneIcon, PowerIcon, PowerOffIcon, RotateCcwIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOpenConfirmDialog, useOpenPromptDialog } from '@/hooks/dialogs';
import { useBackendApi } from '@/hooks/fetch';
import { useCloseAllSheets } from '@/hooks/sheets';
import { useAdminPerms } from '@/hooks/auth';


const controlButtonsVariants = cva(
    `h-10 sm:h-8 rounded-md transition-colors
    flex flex-grow items-center justify-center flex-shrink-0
    border bg-muted shadow-sm

    focus:outline-none disabled:opacity-50 ring-offset-background  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`,
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

export default function ServerControls() {
    const serverConfigPendingStep = useAtomValue(serverConfigPendingStepAtom);
    const processInstantiated = useAtomValue(processInstantiatedAtom);
    const openConfirmDialog = useOpenConfirmDialog();
    const openPromptDialog = useOpenPromptDialog();
    const closeAllSheets = useCloseAllSheets();
    const { hasPerm } = useAdminPerms();
    const fxsControlApi = useBackendApi({
        method: 'POST',
        path: '/fxserver/controls'
    });
    const fxsCommandsApi = useBackendApi({
        method: 'POST',
        path: '/fxserver/commands'
    });

    const handleServerControl = (action: 'start' | 'stop' | 'restart') => {
        const messageMap = {
            start: 'Starting server',
            stop: 'Stopping server',
            restart: 'Restarting server',
        }
        const toastLoadingMessage = `${messageMap[action]}...`;
        const callApi = () => {
            closeAllSheets();
            fxsControlApi({
                data: { action },
                toastLoadingMessage,
            });
        }
        if (action === 'start') {
            callApi();
        } else {
            openConfirmDialog({
                title: messageMap[action],
                message: `Are you sure you want to ${action} the server?`,
                onConfirm: callApi,
            });
        }
    }
    const handleStartStop = () => {
        handleServerControl(processInstantiated ? 'stop' : 'start');
    }
    const handleRestart = () => {
        if (!processInstantiated) return;
        handleServerControl('restart');
    }

    const handleAnnounce = () => {
        if (!processInstantiated) return;
        openPromptDialog({
            title: 'Send Announcement',
            message: 'Type the message to be broadcasted to all players.',
            placeholder: 'announcement message',
            submitLabel: 'Send',
            required: true,
            onSubmit: (input) => {
                closeAllSheets();
                fxsCommandsApi({
                    data: { action: 'admin_broadcast', parameter: input },
                    toastLoadingMessage: 'Sending announcement...',
                });
            }
        });
    }

    const handleKickAll = () => {
        if (!processInstantiated) return;
        openPromptDialog({
            title: 'Kick All Players',
            message: 'Type the kick reason or leave it blank (press enter)',
            placeholder: 'kick reason',
            submitLabel: 'Send',
            onSubmit: (input) => {
                closeAllSheets();
                fxsCommandsApi({
                    data: { action: 'kick_all', parameter: input },
                    toastLoadingMessage: 'Kicking players...',
                });
            }
        });
    }

    const hasControlPerms = hasPerm('control.server');
    const hasAnnouncementPerm = hasPerm('announcement');

    if (serverConfigPendingStep) {
        return (
            <div className='w-full h-8 text-center tracking-wider font-light opacity-75'>
                Server not configured.
            </div>
        )
    }
    return (
        <div className="flex flex-row justify-between gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    {processInstantiated
                        ? <button
                            onClick={handleStartStop}
                            className={controlButtonsVariants({ type: 'destructive' })}
                            disabled={!hasControlPerms}
                        >
                            <PowerOffIcon className='h-5' />
                        </button>
                        : <div className="relative flex flex-grow inset-0">
                            <div className='absolute inset-0 bg-success animate-pulse rounded blur-sm'></div>
                            <button
                                onClick={handleStartStop}
                                className={cn(controlButtonsVariants({ type: 'success' }), 'relative')}
                                disabled={!hasControlPerms}
                            >
                                <PowerIcon className='h-5' />
                            </button>
                        </div>
                    }
                </TooltipTrigger>
                <TooltipContent className={cn(!hasControlPerms && 'text-destructive-inline text-center')}>
                    {hasControlPerms ? (
                        <p>{processInstantiated ? 'Stop the server' : 'Start the server! 🚀'}</p>
                    ) : (
                        <p>
                            You do not have permission <br />
                            to control the server.
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleRestart}
                        className={cn(controlButtonsVariants({ type: 'warning' }))}
                        disabled={!hasControlPerms || !processInstantiated}
                    >
                        <RotateCcwIcon className='h-5' />
                    </button>
                </TooltipTrigger>
                <TooltipContent className={cn(!hasControlPerms && 'text-destructive-inline text-center')}>
                    {hasControlPerms ? (
                        <p>Restart Server</p>
                    ) : (
                        <p>
                            You do not have permission <br />
                            to control the server.
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleKickAll}
                        className={controlButtonsVariants()}
                        disabled={!hasControlPerms || !processInstantiated}
                    >
                        <KickAllIcon style={{ height: '1.25rem', width: '1.5rem', fill: 'currentcolor' }} />
                    </button>
                </TooltipTrigger>
                <TooltipContent className={cn(!hasControlPerms && 'text-destructive-inline text-center')}>
                    {hasControlPerms ? (
                        <p>Kick All Players</p>
                    ) : (
                        <p>
                            You do not have permission <br />
                            to control the server.
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleAnnounce}
                        className={controlButtonsVariants()}
                        disabled={!hasAnnouncementPerm || !processInstantiated}
                    >
                        <MegaphoneIcon className='h-5' />
                    </button>
                </TooltipTrigger>
                <TooltipContent className={cn(!hasAnnouncementPerm && 'text-destructive-inline text-center')}>
                    {hasAnnouncementPerm ? (
                        <p>Send Announcement</p>
                    ) : (
                        <p>
                            You do not have permission <br />
                            to send an Announcement.
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
