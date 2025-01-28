import { CalendarIcon, ChevronRightIcon, Settings2Icon, UserIcon } from "lucide-react";
import { Link } from "wouter";
import { ConfigChangelogEntry } from "@shared/otherTypes";
import { useMemo } from "react";
import { dateToLocaleDateString, dateToLocaleTimeString, isDateToday } from "@/lib/dateTime";
import TxAnchor from "@/components/TxAnchor";


function HeaderLinks() {
    return (
        <div className='flex flex-col px-2 py-1 rounded-lg  text-muted-foreground hover:bg-muted hover:text-primary cursor-pointer'>
            <TxAnchor href='https://github.com/tabarra/txAdmin' className='text-sm'>Documentation</TxAnchor>
            <TxAnchor href='https://discord.gg/txAdmin' className='text-sm'>Support</TxAnchor>
        </div>
    )
}


function HeaderChangelog({ changelogData }: SettingsHeaderProps) {
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
    
    return (
        <div className='flex flex-col px-2 py-1 rounded-lg text-muted-foreground cursor-pointer group relative'>
            <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-card opacity-0 border group-hover:opacity-100 transition-opacity text-primary group-active:bg-primary group-active:text-primary-foreground group-active:border-none select-none">
                View Changelog
            </div>
            <div className='tracking-wider leading-3 font-semibold'>
                <Settings2Icon className='size-4 inline-block align-text-bottom' /> Last Updated
            </div>
            <div className='text-xs'>
                <CalendarIcon className='size-4 inline-block align-text-bottom' /> {mostRecent?.dateTime ?? 'loading...'}
            </div>
            <div className='text-xs'>
                <UserIcon className='size-4 inline-block align-text-bottom' /> {mostRecent?.author ?? 'loading...'}
            </div>
        </div>
    )
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
