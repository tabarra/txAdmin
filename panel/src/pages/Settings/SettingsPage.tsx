import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Settings2Icon, UserIcon } from "lucide-react";

import TxAnchor from '@/components/TxAnchor';
import { useMemo } from "react";
import { setUrlHash } from "@/lib/navigation";
import SettingsTab from "./SettingsTab";

import * as generalGroup from "./tabGroups/general";
import * as fxserverGroup from "./tabGroups/fxserver";
import * as bansGroup from "./tabGroups/bans";
import * as whitelistGroup from "./tabGroups/whitelistTab";
import * as discordGroup from "./tabGroups/discord";
import * as gameMenuGroup from "./tabGroups/gameMenu";
import * as gameNotificationsGroup from "./tabGroups/gameNotifications";


type SettingGroup = {
    id: string;
    name: string;
    MainGroup: React.FC;
    AdvancedGroup?: React.FC;
};

export type SettingTabMulti = {
    id: string;
    name: string;
    groups: SettingGroup[];
};
export type SettingTabSingle = SettingGroup;
export type SettingTabsDatum = SettingTabSingle | SettingTabMulti;

export const settingsTabs: SettingTabsDatum[] = [
    {
        id: 'tab-general',
        name: 'General',
        ...generalGroup,
        //TODO: subgroups [Server Listing, txAdmin]
    },
    {
        id: 'tab-fxserver',
        name: 'FXServer',
        ...fxserverGroup
    },
    {
        id: 'tab-bans',
        name: 'Bans',
        ...bansGroup
    },
    {
        id: 'tab-whitelist',
        name: 'Whitelist',
        ...whitelistGroup
    },
    {
        id: 'tab-discord',
        name: 'Discord',
        ...discordGroup
    },
    {
        id: 'tab-game',
        name: 'Game',
        groups: [
            {
                id: 'menu',
                name: 'Menu',
                ...gameMenuGroup
            },
            {
                id: 'notifications',
                name: 'Notifications',
                ...gameNotificationsGroup
            }
        ]
    },
];

function HeaderChangelog() {
    return (
        <div className='flex flex-col px-2 py-1 rounded-lg  text-muted-foreground hover:bg-muted hover:text-primary cursor-pointer'>
            <div className='tracking-wider leading-3 font-semibold'>
                <Settings2Icon className='size-4 inline-block align-text-bottom' /> Last Updated
            </div>
            <div className='text-xs'>
                <CalendarIcon className='size-4 inline-block align-text-bottom' /> 2021-09-01 12:00:00
            </div>
            <div className='text-xs'>
                <UserIcon className='size-4 inline-block align-text-bottom' /> Jon Doe
            </div>
        </div>
    )
}
function HeaderLinks() {
    return (
        <div className='flex flex-col px-2 py-1 rounded-lg  text-muted-foreground hover:bg-muted hover:text-primary cursor-pointer'>
            <TxAnchor href='https://github.com/tabarra/txAdmin' className='text-sm'>Documentation</TxAnchor>
            <TxAnchor href='https://github.com/tabarra/txAdmin' className='text-sm'>Support</TxAnchor>
        </div>
    )
}

function PageHeader() {
    return (
        <header className='border-b mb-4'>
            <div className='flex justify-between items-center px-4 py-2'>
                <h1 className='text-2xl font-semibold'>
                    <Settings2Icon className="size-6 mt-0.5 inline-block align-text-top text-muted-foreground" /> Settings
                    {/* Settings */}
                </h1>
                {/* <Button size='sm'>Save Changes</Button> */}
                <HeaderChangelog />
                {/* <HeaderLinks /> */}
            </div>
        </header>
    )
}



export default function SettingsPage() {
    const defaultTab = useMemo(() => {
        const pageHash = window.location?.hash.slice(1);
        return settingsTabs.find(tab => tab.id === pageHash)?.id ?? settingsTabs[0].id;
    }, [settingsTabs]);

    return (
        <div className="w-full mb-10">
            <PageHeader />
            <div className="px-0 xs:px-3 md:px-0 flex flex-row gap-2 w-full">

                <Tabs defaultValue={defaultTab} onValueChange={setUrlHash} className="w-full">
                    <TabsList
                        className="max-xs:sticky max-xs:top-navbarvh z-10 flex-wrap h-[unset] max-xs:w-full max-xs:rounded-none"
                    >
                        {settingsTabs.map((group) => (
                            <TabsTrigger
                                key={group.id}
                                value={group.id}
                                className="hover:text-primary"
                            >
                                {group.name}
                                {/* <TriangleAlertIcon className="inline-block size-4 mt-0.5 ml-1 text-destructive self-center" /> */}
                                {/* <DynamicNewBadge size='xs' featName="ignore" /> */}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {settingsTabs.map((tab) => (
                        <TabsContent value={tab.id} key={tab.id} className="mt-6">
                            <SettingsTab tab={tab} />
                        </TabsContent>
                    ))}
                </Tabs>

            </div>
        </div>
    )
}
