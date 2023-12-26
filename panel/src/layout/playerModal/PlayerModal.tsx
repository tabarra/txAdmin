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
import InfoTab from "./InfoTab";
import { useEffect, useState } from "react";
import IdsTab from "./IdsTab";
import { ScrollArea } from "@/components/ui/scroll-area";
import HistoryTab from "./HistoryTab";
import BanTab from "./BanTab";
import GenericSpinner from "@/components/GenericSpinner";


const modalTabs = [
    {
        title: 'Info',
        icon: <InfoIcon className="mr-2 h-5 w-5 hidden xs:block" />,
        content: <InfoTab />
    },
    {
        title: 'IDs',
        icon: <ListIcon className="mr-2 h-5 w-5 hidden xs:block" />,
        content: 'ids ids ids'
    },
    {
        title: 'History',
        icon: <HistoryIcon className="mr-2 h-5 w-5 hidden xs:block" />,
        content: 'history history history'
    },
    {
        title: 'Ban',
        icon: <BanIcon className="mr-2 h-5 w-5 hidden xs:block" />,
        content: 'ban ban ban'
    }
]


export default function PlayerModal() {
    const { isModalOpen, closeModal, playerRef } = usePlayerModalStateValue();
    const [selectedTab, setSelectedTab] = useState(modalTabs[0].title);

    useEffect(() => {
        if (!isModalOpen) {
            setTimeout(() => {
                setSelectedTab(modalTabs[0].title);
            }, 200);
        }
    }, [isModalOpen]);

    const handleOpenClose = (newOpenState: boolean) => {
        if (isModalOpen && !newOpenState) {
            closeModal();
        }
    };

    // const modalData = undefined;
    const modalData = 'whatever';

    return (
        <Dialog open={isModalOpen} onOpenChange={handleOpenClose}>
            <DialogContent
                className="max-w-2xl h-full sm:h-auto max-h-full p-0 gap-1 sm:gap-4 flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>[1234] Whatever Example</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row md:px-4 h-full">
                    <div className="flex flex-row md:flex-col gap-1 bg-muted md:bg-transparent p-1 md:p-0 mx-2 md:mx-0 rounded-md !bg-cyan-700x">
                        {modalTabs.map((tab, index) => (
                            <Button
                                key={tab.title}
                                variant={selectedTab === tab.title ? "secondary" : "ghost"}
                                className={`w-full tracking-wider justify-center md:justify-start
                                    h-7 rounded-sm px-2 text-sm
                                    md:h-10 md:text-base`}
                                onClick={() => setSelectedTab(tab.title)}
                            >
                                {tab.icon} {tab.title}
                            </Button>
                        ))}
                    </div>
                    {/* NOTE: consistent height: sm:h-[19rem] */}
                    <ScrollArea className="w-full max-h-[calc(100vh-3.125rem-4rem-5rem)] px-4 py-2 md:py-0">
                        {!modalData ? (
                            <div className="flex items-center justify-center min-h-[18.5rem]">
                                <GenericSpinner msg="Loading..." />
                            </div>
                        ) : (
                            <>
                                {selectedTab === 'Info' && <InfoTab />}
                                {selectedTab === 'IDs' && <IdsTab />}
                                {selectedTab === 'History' && <HistoryTab />}
                                {selectedTab === 'Ban' && <BanTab />}
                            </>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="max-w-2xl gap-2 p-2 md:p-4 border-t grid grid-cols-2 sm:flex">
                    <Button
                        variant='outline'
                        size='sm'
                        disabled={false} //FIXME:
                        onClick={() => { }} //FIXME:
                        className="pl-2 sm:mr-auto"
                    >
                        <ShieldCheckIcon className="h-5 mr-1" /> Give Admin
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        disabled={false} //FIXME:
                        onClick={() => { }} //FIXME:
                        className="pl-2"
                    >
                        <MailIcon className="h-5 mr-1" /> DM
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
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
                        size='sm'
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
