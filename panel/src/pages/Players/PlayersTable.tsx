import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ScrollArea } from '@/components/ui/scroll-area';
import TxAnchor from '@/components/TxAnchor';
import { PlayerType, mockBackendApi } from '../TestingPage/mockPlayersApi';
import { cn, createRandomHslColor, msToShortDuration, tsToLocaleDateTime } from '@/lib/utils';
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2Icon } from 'lucide-react';
import { useOpenPlayerModal } from "@/hooks/playerModal";
import { PlayersTableFiltersType, PlayersTableSearchType, PlayersTableSortingType } from '@shared/playerApiTypes';


/**
 * Player row
 */
type PlayerRowProps = {
    rowData: PlayerType;
    modalOpener: ReturnType<typeof useOpenPlayerModal>;
}

function PlayerRow({ rowData, modalOpener }: PlayerRowProps) {
    const openModal = () => {
        modalOpener({ license: rowData.license });
    }
    //border-r whitespace-nowrap text-ellipsis overflow-hidden
    return (
        <TableRow onClick={openModal} className='cursor-pointer'>
            <TableCell className='px-4 py-2 border-r'>{rowData.displayName}</TableCell>
            <TableCell className='px-4 py-2 border-r'>{msToShortDuration(rowData.playTime * 60_000)}</TableCell>
            <TableCell className='px-4 py-2 border-r'>{tsToLocaleDateTime(rowData.tsJoined / 1000)}</TableCell>
            <TableCell className='px-4 py-2'>{tsToLocaleDateTime(rowData.tsLastConnection / 1000)}</TableCell>
        </TableRow>
    )
}

/**
 * Last row
 */
type LastRowProps = {
    hasReachedEnd: boolean;
    loadError: string | null;
    isFetching: boolean;
    retryFetch: (_reset?: boolean) => Promise<void>;
}

function LastRow({ hasReachedEnd, isFetching, loadError, retryFetch }: LastRowProps) {
    let content: React.ReactNode;
    if (hasReachedEnd) {
        content = <span className='font-bold text-muted-foreground'>You have reached the end of the list.</span>
    } else if (isFetching) {
        content = <Loader2Icon className="mx-auto animate-spin" />
    } else if (loadError) {
        content = <span>Error: {loadError}. <button onClick={() => retryFetch()}>Try again?</button></span>
    } else {
        content = <span>
            You've found the end of the rainbow, but there's no pot of gold here. <br />
            <i>(this is a bug, please report it in <TxAnchor href="https://discord.gg/txAdmin" target="_blank" rel="noopener noreferrer">discord.gg/txAdmin</TxAnchor>)</i>
        </span>
    }

    return (
        <TableRow>
            <TableCell colSpan={4} className='px-4 py-2 text-center'>
                {content}
            </TableCell>
        </TableRow>
    )
}


/**
 * Sortable table header
 */
type SortableTableHeaderProps = {
    label: string;
    sortKey: 'playTime' | 'tsJoined' | 'tsLastConnection';
    sortingState: PlayersTableSortingType;
    setSorting: (newState: PlayersTableSortingType) => void;
}

function SortableTableHeader({ label, sortKey, sortingState, setSorting }: SortableTableHeaderProps) {
    const isSorted = sortingState.key === sortKey;
    const isDesc = sortingState.desc;
    const sortIcon = isSorted ? (isDesc ? '▼' : '▲') : <></>;
    const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        setSorting({
            key: sortKey,
            desc: isSorted ? (!isDesc) : true
        });
    }
    return (
        <th
            onClick={onClick}
            className={cn(
                'py-2 px-4 text-left font-light tracking-wider cursor-pointer hover:font-medium hover:dark:bg-zinc-600',
                isSorted && 'font-medium dark:bg-zinc-700',
            )}
        >
            {label}
            <div className='ml-1 min-w-[2ch] inline-block'>{sortIcon}</div>
        </th>
    )
}


/**
 * Players table
 */
type PlayersTableProps = {
    search: PlayersTableSearchType;
    filters: PlayersTableFiltersType;
}

export default function PlayersTable({ search, filters }: PlayersTableProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [players, setPlayers] = useState<PlayerType[]>([]);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<PlayersTableSortingType>({ key: 'tsJoined', desc: true });
    const [dbPlayerCount, setDbPlayerCount] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const openPlayerModal = useOpenPlayerModal();

    const fetchNextPage = async (reset?: boolean) => {
        setIsFetching(true);
        setLoadError(null);
        if (reset) {
            setIsResetting(true);
        }
        try {
            const offset = !reset && players.length ? {
                param: players[players.length - 1][sorting.key],
                license: players[players.length - 1].license
            } : undefined;
            const {
                players: newPlayers,
                hasReachedEnd,
                dbPlayerCount
            } = await mockBackendApi({
                offset,
                search,
                filters,
                sorting: {
                    key: sorting.key,
                    desc: sorting.desc
                },
            });
            setDbPlayerCount(dbPlayerCount);
            setHasReachedEnd(hasReachedEnd);
            setIsResetting(false);
            if (newPlayers.length) {
                setPlayers((prev) => reset ? newPlayers : [...prev, ...newPlayers]);
            } else {
                setPlayers([]);
            }
        } catch (error) {
            setLoadError(`Failed to fetch more data: ${(error as Error).message}`);
        } finally {
            setIsFetching(false);
        }
    };

    // The virtualizer
    const rowVirtualizer = useVirtualizer({
        scrollingDelay: 0,
        count: players.length + 1,
        getScrollElement: () => (scrollRef.current as HTMLDivElement)?.getElementsByTagName('div')[0],
        estimateSize: () => 38, // border-b
        overscan: 10,
    });
    const virtualItems = rowVirtualizer.getVirtualItems();
    const virtualizerTotalSize = rowVirtualizer.getTotalSize();

    //NOTE: This is required due to how css works on tables
    //ref: https://github.com/TanStack/virtual/issues/585
    let TopRowPad: React.ReactNode = null;
    let BottomRowPad: React.ReactNode = null;
    if (virtualItems.length > 0) {
        const padStart = virtualItems[0].start - rowVirtualizer.options.scrollMargin;
        if (padStart > 0) {
            TopRowPad = <tr><td colSpan={3} style={{ height: padStart }} /></tr>;
        }
        const padEnd = virtualizerTotalSize - virtualItems[virtualItems.length - 1].end;
        if (padEnd > 0) {
            BottomRowPad = <tr><td colSpan={3} style={{ height: padEnd }} /></tr>;
        }
    }

    // Automagically fetch next page when reaching the end
    useEffect(() => {
        if (!players.length || !virtualItems.length) return;
        const lastVirtualItemIndex = virtualItems[virtualItems.length - 1].index;
        if (players.length <= lastVirtualItemIndex && !hasReachedEnd && !isFetching) {
            fetchNextPage()
        }
    }, [players, virtualItems, hasReachedEnd, isFetching]);

    //fetch the first page automatically
    useEffect(() => {
        if (!players.length) fetchNextPage(true);
    }, []);

    //on sorting change, reset the list
    useEffect(() => {
        rowVirtualizer.scrollToIndex(0);
        fetchNextPage(true);
    }, [search, filters, sorting]);


    return (
        <div
            className="w-full max-h-full min-h-96 overflow-auto border md:rounded-lg"
            style={{ overflowAnchor: "none" }}
        >
            {/* <div
                className='w-full bg-black p-2'
                style={{ color: createRandomHslColor() }}
            >{JSON.stringify({ search, filters, sorting })}</div> */}
            <ScrollArea className="h-full" ref={scrollRef}>
                <table className='w-full caption-bottom text-sm table-fixed select-none'>
                    <TableHeader>
                        <tr className='sticky top-0 z-10 bg-zinc-200 dark:bg-muted text-secondary-foreground text-base shadow-md transition-colors'>
                            <th className='w-[50%]x py-2 px-4 font-light tracking-wider text-left text-muted-foreground'>
                                Display Name
                            </th>
                            <SortableTableHeader
                                label='Play Time'
                                sortKey='playTime'
                                sortingState={sorting}
                                setSorting={setSorting}
                            />
                            <SortableTableHeader
                                label='First Joined'
                                sortKey='tsJoined'
                                sortingState={sorting}
                                setSorting={setSorting}
                            />
                            <SortableTableHeader
                                label='Last Connection'
                                sortKey='tsLastConnection'
                                sortingState={sorting}
                                setSorting={setSorting}
                            />
                        </tr>
                    </TableHeader>
                    <TableBody className={cn(isResetting && 'opacity-25')}>
                        {TopRowPad}
                        {virtualItems.map((virtualItem) => {
                            const isLastRow = virtualItem.index > players.length - 1;
                            return isLastRow ? (
                                <LastRow
                                    key={virtualItem.key}
                                    hasReachedEnd={hasReachedEnd}
                                    loadError={loadError}
                                    isFetching={isFetching}
                                    retryFetch={fetchNextPage}
                                />
                            ) : (
                                <PlayerRow
                                    key={virtualItem.key}
                                    rowData={players[virtualItem.index]}
                                    modalOpener={openPlayerModal}
                                />
                            )
                        })}
                        {BottomRowPad}
                    </TableBody>
                </table>
            </ScrollArea>
        </div>
    );
}
