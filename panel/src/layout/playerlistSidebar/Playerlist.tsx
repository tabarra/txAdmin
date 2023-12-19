import { playerlistAtom } from "@/hooks/playerlist";
import cleanPlayerName from "@shared/cleanPlayerName";
import { useAtomValue } from "jotai";
import { VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef, useState } from "react";
import { PlayerlistPlayerType } from "@shared/socketioTypes";
import { Input } from "@/components/ui/input";
import { ArrowDownWideNarrowIcon, XIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


//NOTE: the styles have been added to global.css since this component is rendered A LOT
function PlayerlistPlayer({ virtualItem, player }: { virtualItem: VirtualItem, player: PlayerlistPlayerType }) {
    return (
        <div
            className="player"
            style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
            }}
        >
            <div className="pid-block">
                <span className="pid-badge">{player.netid}</span>
            </div>
            <span className="pname">{player.displayName}</span>
        </div>
    )
}


export default function Playerlist() {
    const playerlist = useAtomValue(playerlistAtom);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [filterString, setFilterString] = useState('');

    //FIXME: temporary logic, use fuse.js or something like that
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
        scrollingDelay: 0,
        count: filteredPlayerlist.length,
        getScrollElement: () => (scrollRef.current as HTMLDivElement)?.getElementsByTagName('div')[0],
        estimateSize: () => 30,
        overscan: 15,
    });
    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
        <>
            {/* FIXME: With the filter/sorting dropdown, this will become an expensive component, memoize it! */}
            <div className="pt-4 px-2 flex gap-2">
                <div className="relative w-full">
                    <Input
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
                    {filterString && <button
                        className="absolute right-2 top-0 bottom-0 text-slate-600"
                        onClick={() => setFilterString('')}
                    >
                        <XIcon />
                    </button>}
                </div>
                <Button
                    variant="default"
                    className="h-8 w-8"
                ><ArrowDownWideNarrowIcon /></Button>
            </div>

            <div
                className={cn(
                    'text-center m-1 text-warning tracking-wider italic text-xs',
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
            <ScrollArea className="h-full" ref={scrollRef}>
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
                        />
                    ))}
                </div>
            </ScrollArea>
        </>
    );
}
