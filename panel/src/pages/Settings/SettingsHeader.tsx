import { CalendarIcon, Settings2Icon, UserIcon } from "lucide-react";
import { ConfigChangelogEntry } from "@shared/otherTypes";
import { useMemo, useState } from "react";
import { dateToLocaleDateString, dateToLocaleTimeString, isDateToday, tsToLocaleDateTimeString } from "@/lib/dateTime";
import TxAnchor from "@/components/TxAnchor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createRandomHslColor } from "@/lib/utils";


function HeaderLinks() {
    return (
        <div className='flex flex-col px-2 py-1 rounded-lg  text-muted-foreground hover:bg-muted hover:text-primary cursor-pointer'>
            <TxAnchor href='https://github.com/tabarra/txAdmin' className='text-sm'>Documentation</TxAnchor>
            <TxAnchor href='https://discord.gg/txAdmin' className='text-sm'>Support</TxAnchor>
        </div>
    )
}

function ChangelogEntry({ entry }: { entry: ConfigChangelogEntry }) {
    return (
        <div className='flex flex-col gap-2 px-3 py-2 rounded-md border odd:bg-card/75'>
            <div className="flex justify-between items-center">
                <div className='font-semibold text-accent'>
                    <UserIcon className='size-5 mr-2 inline-block align-text-bottom opacity-65' />
                    {entry.author}
                </div>
                <div className='text-sm text-muted-foreground'>
                    {tsToLocaleDateTimeString(entry.ts, 'short', 'short')}
                </div>
            </div>
            <div className='flex gap-1 flex-wrap text-sm'>
                {entry.keys.length ? entry.keys.map((cfg, index) => (
                    <span>
                        <div key={cfg} className='inline px-1 py-0.5 font-mono tracking-wide rounded bg-secondary/50'>{cfg}</div>
                        {index < entry.keys.length - 1 && ','}
                    </span>
                )) : (
                    <div className='italic'>No changes</div>
                )}
            </div>
        </div>
    )
}


function HeaderChangelog({ changelogData }: SettingsHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const mostRecent = useMemo(() => {
        if (!changelogData?.length) return null;
        const last = changelogData[changelogData.length - 1];
        const lastDate = new Date(last.ts);
        const timeStr = dateToLocaleTimeString(lastDate, '2-digit', '2-digit');
        const dateStr = dateToLocaleDateString(lastDate, 'short');
        const titleTimeIndicator = isDateToday(lastDate) ? timeStr : dateStr;
        return {
            author: last.author,
            dateTime: titleTimeIndicator,
        }
    }, [changelogData]);

    const reversedChangelog = useMemo(() => {
        if (!changelogData) return null;
        return [...changelogData].reverse();
    }, [changelogData]);

    const handleOpenChangelog = () => {
        setIsModalOpen(true);
    }

    const placeholder = Array.isArray(changelogData) ? 'No changes yet' : 'loading...';

    return (<>
        <div className='flex flex-col px-2 py-1 rounded-lg text-muted-foreground group relative'>
            {reversedChangelog?.length ? (
                <div
                    className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-card opacity-0 border group-hover:opacity-100 transition-opacity text-primary group-active:bg-primary group-active:text-primary-foreground group-active:border-none select-none cursor-pointer"
                    onClick={handleOpenChangelog}
                >
                    View Changelog
                </div>
            ) : null}
            <div className='tracking-wider leading-3 font-semibold'>
                <Settings2Icon className='size-4 inline-block align-text-bottom' /> Last Updated
            </div>
            <div className='text-xs'>
                <CalendarIcon className='size-4 inline-block align-text-bottom' /> {mostRecent?.dateTime ?? placeholder}
            </div>
            <div className='text-xs'>
                <UserIcon className='size-4 inline-block align-text-bottom' /> {mostRecent?.author ?? placeholder}
            </div>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className='max-sm:p-4 max-w-xl'>
                <DialogHeader>
                    <DialogTitle>Recent Setting Changes</DialogTitle>
                </DialogHeader>
                <div
                    className="pr-3 max-h-[80vh] overflow-auto space-y-3"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {reversedChangelog?.map((entry, i) => <ChangelogEntry key={i} entry={entry} />)}
                </div>
            </DialogContent>
        </Dialog>
    </>)
}


type SettingsHeaderProps = {
    changelogData?: ConfigChangelogEntry[];
}

export default function SettingsHeader({ changelogData }: SettingsHeaderProps) {
    return (
        <header className='border-b mb-4'>
            <div className='flex justify-between items-center px-4 py-2'>
                <h1 className='text-2xl font-semibold'>
                    <Settings2Icon className="size-6 mt-0.5 inline-block align-text-top text-muted-foreground" /> Settings
                    {/* Settings */}
                </h1>
                <HeaderChangelog changelogData={changelogData} />
                {/* <HeaderLinks /> */}
            </div>
        </header>
    )
}

//TODO: dynamic breadcrumb
// export default function SettingsHeader({ changelogData }: SettingsHeaderProps) {
//     return (
//         <header className='border-b mb-4'>
//             <div className='flex justify-between items-center px-4 py-2'>
//                 <ol className='flex flex-wrap items-center gap-1 sm:gap-2.5 text-2xl text-muted-foreground leading-nonex'>
//                     <Settings2Icon className='opacity-75' />
//                     <Link href="/settings" className='hover:text-secondary-foreground hover:underline'>Settings</Link>
//                     <ChevronRightIcon className='opacity-75' />
//                     {/* <li className="text-secondary-foreground">Ban Templates</li> */}
//                     <li className="text-secondary-foreground">Discord Status</li>
//                 </ol>
//                 <HeaderChangelog changelogData={changelogData} />
//                 {/* <HeaderLinks /> */}
//             </div>
//         </header>
//     )
// }
