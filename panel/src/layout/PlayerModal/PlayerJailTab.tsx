import { Button } from "@/components/ui/button";
import { useAdminPerms } from "@/hooks/auth";
import { PlayerModalRefType, useClosePlayerModal } from "@/hooks/playerModal";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import JailForm, { JailFormType } from "@/components/JailForm";
import { txToast } from "@/components/TxToaster";
import { ModalTabInner, ModalTabMessage } from "@/components/modal-tabs";


type PlayerJailTabProps = {
    playerRef: PlayerModalRefType;
};

export default function PlayerJailTab({ playerRef }: PlayerJailTabProps) {
    const jailFormRef = useRef<JailFormType>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { hasPerm } = useAdminPerms();
    const closeModal = useClosePlayerModal();
    const playerJailApi = useBackendApi<GenericApiOkResp>({
        method: 'POST',
        path: `/player/jail`,
        throwGenericErrors: true,
    });

    if (!hasPerm('players.jail')) {
        return <ModalTabMessage>
            You don't have permission to jail players.
        </ModalTabMessage>;
    }

    const handleSave = () => {
        if (!jailFormRef.current) return;
        const { reason, duration } = jailFormRef.current.getData();

        if (!reason || reason.length < 3) {
            txToast.warning(`The reason must be at least 3 characters long.`);
            jailFormRef.current.focusReason();
            return;
        }

        setIsSaving(true);
        playerJailApi({
            queryParams: playerRef,
            data: { reason, duration },
            toastLoadingMessage: 'Jailing player...',
            genericHandler: {
                successMsg: 'Player jailed.',
            },
            finally: () => setIsSaving(false),
            success: () => closeModal(),
        });
    };

    return (
        <ModalTabInner className="grid gap-4">
            <JailForm
                ref={jailFormRef}
                disabled={isSaving}
            />
            <div className="flex place-content-end">
                <Button
                    size="sm"
                    variant="warning"
                    disabled={isSaving}
                    onClick={handleSave}
                >
                    {isSaving ? (
                        <span className="flex items-center leading-relaxed">
                            <Loader2Icon className="inline animate-spin h-4" /> Jailing...
                        </span>
                    ) : 'Apply Jail'}
                </Button>
            </div>
        </ModalTabInner>
    );
}
