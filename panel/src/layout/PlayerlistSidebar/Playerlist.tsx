import { playerlistAtom, serverMutexAtom } from "@/hooks/playerlist";
import cleanPlayerName from "@shared/cleanPlayerName";
import { useAtomValue } from "jotai";
import { VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import { memo, useMemo, useRef, useState } from "react";
import { PlayerlistPlayerType } from "@shared/socketioTypes";
import { Input } from "@/components/ui/input";
import { FilterXIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useOpenPlayerModal } from "@/hooks/playerModal";
import InlineCode from "@/components/InlineCode";
import { useEventListener } from "usehooks-ts";


//NOTE: Move the styles (except color) to global.css since this component is rendered often
function TagColor({ color }: { color: string }) {
    return <div
        className="outline-none focus:outline-none"
        style={{
            display: 'inline-block',
            backgroundColor: color,
            width: '0.375rem',
            borderRadius: '2px',
        }}
    >&nbsp;</div>;
}


type PlayerlistFilterProps = {
    filterString: string;
    setFilterString: (s: string) => void;
};
function PlayerlistFilter({ filterString, setFilterString }: PlayerlistFilterProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    useEventListener('message', (e: TxMessageEvent) => {
        if (e.data.type === 'globalHotkey' && e.data.action === 'focusPlayerlistFilter') {
            inputRef.current?.focus();
        }
    });

    return (
        <div className="pt-2 px-2 flex gap-2">
            <div className="relative w-full">
                <Input
                    ref={inputRef}
                    className="h-8"
                    placeholder="Filter by Name or ID"
                    value={filterString}
                    onChange={(e) => setFilterString(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setFilterString('');
                        }
                    }}
                />
                {filterString ? (
                    <button
                        className="absolute right-2 inset-y-0 text-zinc-500 dark:text-zinc-400 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                        onClick={() => setFilterString('')}
                    >
                        <XIcon />
                    </button>
                ) : (
                    <div className="absolute right-2 inset-y-0 flex items-center text-zinc-500 dark:text-zinc-400 select-none pointer-events-none">
                        <InlineCode className="text-xs tracking-wide">ctrl+k</InlineCode>
                    </div>
                )}
            </div>
            {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            'h-8 w-8 inline-flex justify-center items-center rounded-md shrink-0',
                            'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            'border bg-muted shadow-sm',
                            'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                        )}
                    >
                        <SlidersHorizontalIcon className="h-5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                        checked={true}
                        className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                    >
                        <div className="flex justify-around min-w-full">
                            <span className="grow pr-4">Admin</span>
                            <TagColor color="#EF4444" />
                        </div>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={true}
                        className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                    >
                        <div className="flex justify-around min-w-full">
                            <span className="grow pr-4">Newcomer</span>
                            <TagColor color="#A3E635" />
                        </div>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={false}
                        className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                    >
                        <div className="flex justify-around min-w-full">
                            <span className="grow pr-4">Watch List</span>
                            <TagColor color="#FB923C" />
                        </div>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuItem
                        onClick={undefined}
                        className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                    >
                        <FilterXIcon className="mr-2 h-4 w-4" />
                        Clear Filter
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value="id">
                        <DropdownMenuRadioItem
                            value="id"
                            className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                        >Join Order</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                            value="tag"
                            className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                        >Tag Priority</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu> */}
        </div>
    );
}
const PlayerlistFilterMemo = memo(PlayerlistFilter);


type PlayerlistPlayerProps = {
    virtualItem: VirtualItem,
    player: PlayerlistPlayerType,
    modalOpener: (netid: number) => void,
}
//NOTE: the styles have been added to global.css since this component is rendered A LOT
function PlayerlistPlayer({ virtualItem, player, modalOpener }: PlayerlistPlayerProps) {
    return (
        <div
            className="player"
            style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
            }}
            onClick={() => modalOpener(player.netid)}
        >
            <div className="pid-block leading-[1.7]">
                <span className="pid-badge">{player.netid}</span>
            </div>
            <span className="pname">{player.displayName}</span>
        </div>
    )
}


export default function Playerlist() {
    const playerlist = useAtomValue(playerlistAtom);
    const serverMutex = useAtomValue(serverMutexAtom);
    const openPlayerModal = useOpenPlayerModal();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [filterString, setFilterString] = useState('');

    //TODO: temporary logic, use fuse.js or something like that
    const filteredPlayerlist = useMemo(() => {
        const pureFilter = cleanPlayerName(filterString).pureName;
        if (pureFilter !== 'emptyname') {
            return playerlist.filter((player) => {
                return player.pureName.includes(pureFilter) || player.netid.toString().includes(pureFilter);
            })
        } else {
            return playerlist;
        }
    }, [playerlist, filterString]);

    //NOTE: I tried many algorithms to calculate the minimum width of the ID column,
    // but the simplest one was the best one when considering performance.
    const injectedStyle = useMemo(() => {
        const maxId = playerlist.at(-1)?.netid ?? 0;
        const idCharLength = Math.floor(Math.log10(maxId)) + 1; //+1 because log10(1...9) < 1
        return `.tx-playerlist .player .pid-block { min-width: ${idCharLength + 1}ch; }`; //+1 due to badge padding
    }, [playerlist]);

    // The virtualizer
    const rowVirtualizer = useVirtualizer({
        isScrollingResetDelay: 0,
        count: filteredPlayerlist.length,
        getScrollElement: () => (scrollRef.current as HTMLDivElement)?.getElementsByTagName('div')[0],
        estimateSize: () => 30,
        overscan: 15,
    });
    const virtualItems = rowVirtualizer.getVirtualItems();

    const modalOpener = (netid: number) => {
        if (!serverMutex) return;
        openPlayerModal({ mutex: serverMutex, netid });
    }

    return (
        <>
            <PlayerlistFilterMemo filterString={filterString} setFilterString={setFilterString} />

            <div
                className={cn(
                    'text-center m-1 text-warning-inline tracking-wider italic text-xs',
                    filteredPlayerlist.length !== playerlist.length && virtualItems.length ? 'block' : 'hidden'
                )}
            >
                Showing {filteredPlayerlist.length} of {playerlist.length} players.
            </div>
            <div
                className={cn(
                    'text-center m-6 text-muted-foreground tracking-wider italic',
                    virtualItems.length ? 'hidden' : 'block'
                )}
            >
                {playerlist.length && filterString ? (
                    <p>
                        No players to show.
                        <span className="text-xs block opacity-75">Clear the filter to show all players.</span>
                    </p>
                ) : (
                    <p>
                        No players online.
                        <span className="text-xs block opacity-75">Invite some friends to join in!</span>
                    </p>
                )}
            </div>

            <style>{injectedStyle}</style>
            <ScrollArea className="h-full select-none" ref={scrollRef}>
                <div
                    className="tx-playerlist"
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualItems.map((virtualItem) => (
                        <PlayerlistPlayer
                            key={virtualItem.key}
                            virtualItem={virtualItem}
                            player={filteredPlayerlist[virtualItem.index]}
                            modalOpener={modalOpener}
                        />
                    ))}
                </div>
            </ScrollArea>
        </>
    );
}
