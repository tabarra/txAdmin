import { Button } from "@/components/ui/button";
import { useAdminPerms } from "@/hooks/auth";
import { cn, tsToLocaleDateTime } from "@/lib/utils";
import { PlayerHistoryItem } from "@shared/playerApiTypes";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import InlineCode from "@/components/InlineCode";
import PlayerModalMidMessage from "./PlayerModalMidMessage";


type HistoryItemProps = {
    action: PlayerHistoryItem,
    permsDisableWarn: boolean,
    permsDisableBan: boolean,
    serverTime: number,
    doRevokeAction: (actionId: string) => void,
}

function HistoryItem({ action, permsDisableWarn, permsDisableBan, serverTime, doRevokeAction }: HistoryItemProps) {
    const isRevokeDisabled = (
        !!action.revokedBy ||
        (action.type === 'warn' && permsDisableWarn) ||
        (action.type === 'ban' && permsDisableBan)
    );

    let footerNote, borderColorClass, actionMessage;
    if (action.type === 'ban') {
        borderColorClass = 'border-destructive';
        actionMessage = `BANNED by ${action.author}`;
    } else if (action.type === 'warn') {
        borderColorClass = 'border-warning';
        actionMessage = `WARNED by ${action.author}`;
    }
    if (action.revokedBy) {
        borderColorClass = '';
        const revocationDate = tsToLocaleDateTime(action.revokedAt ?? 0, 'medium', 'short');
        footerNote = `Revoked by ${action.revokedBy} on ${revocationDate}.`;
    } else if (typeof action.exp === 'number') {
        const expirationDate = tsToLocaleDateTime(action.exp, 'medium', 'short');
        footerNote = (action.exp < serverTime) ? `Expired on ${expirationDate}.` : `Expires in ${expirationDate}.`;
    }

    return (
        <div className={cn('pl-2 border-l-4 hover:bg-muted rounded-r-sm bg-muted/30', borderColorClass)}>
            <div className="flex w-full justify-between">
                <strong className="text-sm text-muted-foreground">{actionMessage}</strong>
                <small className="text-right text-2xs space-x-1">
                    <InlineCode className="tracking-widest">{action.id}</InlineCode>
                    <span
                        className="opacity-75 cursor-help"
                        title={tsToLocaleDateTime(action.ts, 'long', 'long')}
                    >
                        {tsToLocaleDateTime(action.ts, 'medium', 'short')}
                    </span>
                    <Button
                        variant="outline"
                        size='inline'
                        disabled={isRevokeDisabled}
                        onClick={() => { doRevokeAction(action.id) }}
                    >Revoke</Button>
                </small>
            </div>
            <span className="text-sm">{action.reason}</span>
            {footerNote && <small className="block text-xs opacity-75">{footerNote}</small>}
        </div>
    );
}


type HistoryTabProps = {
    actionHistory: PlayerHistoryItem[],
    serverTime: number,
    refreshModalData: () => void,
}

export default function HistoryTab({ actionHistory, serverTime, refreshModalData }: HistoryTabProps) {
    const { hasPerm } = useAdminPerms();
    const hasWarnPerm = hasPerm('players.warn');
    const hasBanPerm = hasPerm('players.ban');
    const revokeActionApi = useBackendApi<GenericApiOkResp>({
        method: 'POST',
        path: `/database/revoke_action`,
    });

    if (!actionHistory.length) {
        return <PlayerModalMidMessage>
            No bans/warns found.
        </PlayerModalMidMessage>;
    }

    const doRevokeAction = (actionId: string) => {
        revokeActionApi({
            data: { actionId },
            toastLoadingMessage: 'Revoking action...',
            genericHandler: {
                successMsg: 'Action revoked.',
            },
            success: (data) => {
                if ('success' in data) {
                    refreshModalData();
                }
            },
        });
    }

    const reversedActionHistory = [...actionHistory].reverse();
    return <div className="flex flex-col gap-1 p-1">
        {reversedActionHistory.map((action) => (
            <HistoryItem
                key={action.id}
                action={action}
                permsDisableWarn={!hasWarnPerm}
                permsDisableBan={!hasBanPerm}
                serverTime={serverTime}
                doRevokeAction={doRevokeAction}
            />
        ))}
    </div>;
}
