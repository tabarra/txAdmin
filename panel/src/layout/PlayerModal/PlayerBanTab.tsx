import { Button } from "@/components/ui/button";
import { useAdminPerms } from "@/hooks/auth";
import { PlayerModalRefType, useClosePlayerModal } from "@/hooks/playerModal";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { useBackendApi } from "@/hooks/fetch";
import { GenericApiOkResp } from "@shared/genericApiTypes";
import ModalCentralMessage from "@/components/ModalCentralMessage";
import type { BanTemplatesDataType, GetForcedBanTemplatesResp,  } from "@shared/otherTypes";
import BanForm, { BanFormType } from "@/components/BanForm";
import { txToast } from "@/components/TxToaster";
import { useEffect } from "react";


type PlayerBanTabProps = {
    banTemplates: BanTemplatesDataType[];
    playerRef: PlayerModalRefType;
};

export default function PlayerBanTab({ playerRef, banTemplates }: PlayerBanTabProps) {
    const banFormRef = useRef<BanFormType>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { hasPerm } = useAdminPerms();
    const [forceBanTemplates, setForceBanTemplates] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const closeModal = useClosePlayerModal();
    const playerBanApi = useBackendApi<GenericApiOkResp>({
        method: 'POST',
        path: `/player/ban`,
        throwGenericErrors: true,
    });
    const forceBanTemplatesApi = useBackendApi<GetForcedBanTemplatesResp>({
        method: 'GET',
        path: `/settings/banTemplates/force`,
        throwGenericErrors: true,
    });

    if (!hasPerm('players.ban')) {
        return <ModalCentralMessage>
            You don't have permission to ban players.
        </ModalCentralMessage>;
    }

    useEffect(() => {
        setIsLoadingConfig(true);
        forceBanTemplatesApi({
            success: (data) => {
                if (data && 'forceBanTemplates' in data) {
                    setForceBanTemplates(data.forceBanTemplates === true);
                }
                setIsLoadingConfig(false);
            },
            error: () => {
                setIsLoadingConfig(false);
            },
        });
    }, []);

    if (isLoadingConfig) {
        return <ModalCentralMessage>
            <Loader2Icon className="inline animate-spin size-6 mr-2" />
            Loading configuration...
        </ModalCentralMessage>;
    }

    const handleSave = () => {
        if (!banFormRef.current) return;
        const { reason, duration } = banFormRef.current.getData();

        if (!reason || reason.length < 3) {
            txToast.warning(`The reason must be at least 3 characters long.`);
            banFormRef.current.focusReason();
            return;
        }

        setIsSaving(true);
        playerBanApi({
            queryParams: playerRef,
            data: {reason, duration},
            toastLoadingMessage: 'Banning player...',
            genericHandler: {
                successMsg: 'Player banned.',
            },
            success: (data) => {
                setIsSaving(false);
                closeModal();
            },
            error: (error) => {
                setIsSaving(false);
            }
        });
    };

    return (
        <div className="grid gap-4 p-1">
            <BanForm
                ref={banFormRef}
                banTemplates={banTemplates}
                forceBanTemplates={forceBanTemplates}
                disabled={isSaving}
                onNavigateAway={() => { closeModal(); }}
            />
            <div className="flex place-content-end">
                <Button
                    size="sm"
                    variant="destructive"
                    disabled={isSaving}
                    onClick={handleSave}
                >
                    {isSaving ? (
                        <span className="flex items-center leading-relaxed">
                            <Loader2Icon className="inline animate-spin h-4" /> Banning...
                        </span>
                    ) : 'Apply Ban'}
                </Button>
            </div>
        </div>
    );
}
