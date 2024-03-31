import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tsToLocaleDateTime } from "@/lib/utils";
import { useRef, useState } from "react";
import { DatabaseActionType } from "../../../../core/components/PlayerDatabase/databaseTypes";
import { useOpenPlayerModal } from "@/hooks/playerModal";



const calcTextAreaLines = (text?: string) => {
    if (!text) return 3;
    const lines = text.trim().split('\n').length + 1;
    return Math.min(Math.max(lines, 3), 16);
}

function ActionReasonBox({ actionReason }: { actionReason: string }) {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [textAreaLines, setTextAreaLines] = useState(calcTextAreaLines(actionReason));

    return <>
        <Label htmlFor="playerNotes">
            Reason:
        </Label>
        <Textarea
            ref={textAreaRef}
            id="playerNotes"
            className="w-full mt-1"
            readOnly={true}
            value={actionReason}
            //1rem of padding + 1.25rem per line
            style={{ height: `${1 + 1.25 * textAreaLines}rem` }}
        />
    </>
}


type ActionInfoTabProps = {
    actionId: string;
    action: DatabaseActionType;
    setSelectedTab: (t: string) => void;
    refreshModalData: () => void;
}

export default function ActionInfoTab({ actionId, action, setSelectedTab, refreshModalData }: ActionInfoTabProps) {
    const actionDateTimeText = tsToLocaleDateTime(action.timestamp);
    const openPlayerModal = useOpenPlayerModal();

    const targetLicenses = action.ids.filter(id => id.startsWith('license:'));
    const linkedPlayer = targetLicenses.length === 1 ? targetLicenses[0].split(':')[1] : false;
    const handleViewPlayerClick = () => {
        if (!linkedPlayer) return;
        openPlayerModal({ license: linkedPlayer });
    }

    return <div className="p-1">
        <dl className="pb-2">
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Date/Time</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">{actionDateTimeText}</dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Admin</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">{action.author}</dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Player</dt>
                <dd className="text-sm leading-6 col-span-2x mt-0">{action.playerName}</dd>
                <dd className="text-right">
                    <Button
                        variant="outline"
                        size='inline'
                        style={{ minWidth: '8.25ch' }}
                        onClick={handleViewPlayerClick}
                        disabled={!linkedPlayer}
                    >
                        View
                    </Button>
                </dd>
            </div>
            <div className="py-0.5 grid grid-cols-3 gap-4 px-0">
                <dt className="text-sm font-medium leading-6 text-muted-foreground">Status</dt>
                <dd className="text-sm leading-6 col-span-2 mt-0">FIXME:</dd>
            </div>

        </dl>

        <ActionReasonBox actionReason={action.reason} />
    </div>;
}
