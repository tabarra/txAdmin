import {
    Dialog,
    DialogContent, DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlayerModalStateValue } from "@/hooks/playerModal";
import { AlertTriangleIcon, MailIcon, ShieldCheckIcon, InfoIcon, ListIcon, HistoryIcon, BanIcon } from "lucide-react";
import { KickOneIcon } from '@/components/KickIcons';


export default function PlayerModal() {
    const { isModalOpen, closeModal, playerRef } = usePlayerModalStateValue();

    const handleOpenClose = (newOpenState: boolean) => {
        if (isModalOpen && !newOpenState) {
            closeModal();
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={handleOpenClose}>
            <DialogContent className="max-w-2xl" autoFocus={false}>
                <DialogHeader>
                    <DialogTitle>[2] Tang Salvatore</DialogTitle>
                </DialogHeader>

                {JSON.stringify(playerRef)}
                <span className="text-fuchsia-500">pretend here lies the player modal content</span>

                <DialogFooter className="w-full justify-centerx xjustify-around sm:flex-colx gap-2">
                    <Button
                        variant='outline'
                        disabled={false} //FIXME:
                        onClick={() => { }} //FIXME:
                        className="pl-2"
                    >
                        <ShieldCheckIcon className="h-5 mr-1" /> Give Admin
                    </Button>
                    <Button
                        variant='outline'
                        disabled={false} //FIXME:
                        onClick={() => { }} //FIXME:
                        className="pl-2"
                    >
                        <MailIcon className="h-5 mr-1" /> DM
                    </Button>
                    <Button
                        variant='outline'
                        disabled={false} //FIXME:
                        onClick={() => { }} //FIXME:
                        className="pl-2"
                    >
                        <KickOneIcon style={{
                            height: '1.25rem',
                            width: '1.75rem',
                            marginRight: '0.25rem',
                            fill: 'currentcolor'
                        }} /> Kick
                    </Button>
                    <Button
                        variant='outline'
                        disabled={false} //FIXME:
                        onClick={() => { }} //FIXME:
                        className="pl-2"
                    >
                        <AlertTriangleIcon className="h-5 mr-1" /> Warn
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
