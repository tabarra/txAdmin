import { memo, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import TxAnchor from '@/components/TxAnchor';
import { PlayerSortingStateType, PlayerType, mockBackendApi } from './mockPlayersApi';
import { cn, msToShortDuration, tsToLocaleDateTime } from '@/lib/utils';
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

import { Loader2Icon, ChevronsUpDownIcon, FilterXIcon, XIcon, ChevronDownIcon, UsersIcon, UserRoundPlusIcon, CalendarPlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
import InlineCode from '@/components/InlineCode';



type PlayerRowProps = {
    rowData: PlayerType;
}

function PlayerRow({ rowData }: PlayerRowProps) {
    //border-r whitespace-nowrap text-ellipsis overflow-hidden
    return (<>
        <TableCell className='px-4 py-2 border-r'>{rowData.displayName}</TableCell>
        <TableCell className='px-4 py-2 border-r'>{msToShortDuration(rowData.playTime * 60_000)}</TableCell>
        <TableCell className='px-4 py-2 border-r'>{tsToLocaleDateTime(rowData.tsJoined / 1000)}</TableCell>
        <TableCell className='px-4 py-2'>{tsToLocaleDateTime(rowData.tsLastConnection / 1000)}</TableCell>
    </>)
}

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
        <TableCell colSpan={4} className='px-4 py-2 text-center'>
            {content}
        </TableCell>
    )
}


function SortableTableHeader({ label, sortKey, sorting, setSorting }: {
    label: string;
    sortKey: 'playTime' | 'tsJoined' | 'tsLastConnection';
    sorting: PlayerSortingStateType;
    setSorting: (newState: PlayerSortingStateType) => void;
}) {
    const isSorted = sorting.sortKey === sortKey;
    const isDesc = sorting.sortDesc;
    const sortIcon = isSorted ? (isDesc ? '▼' : '▲') : <></>;
    const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        setSorting({
            sortKey,
            sortDesc: isSorted ? (!isDesc) : true
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


const availableSearchTypes = [
    {
        value: 'playerName',
        label: 'Name',
        placeholder: 'Enter a player name',
        description: 'Search players by their last display name.'
    },
    {
        value: 'playerNotes',
        label: 'Notes',
        placeholder: 'Enter part of the note to search for',
        description: 'Search players by their profile notes contents.'
    },
    {
        value: 'playerIds',
        label: 'Identifiers',
        placeholder: 'License, Discord, Steam, etc.',
        description: 'Search players by their IDs separated by a comma.'
    },
] as const;

const availableFilters = [
    { label: 'Is Admin', value: 'isAdmin' },
    { label: 'Is Online', value: 'isOnline' },
    { label: 'Is Banned', value: 'isBanned' },
    { label: 'Has Previous Ban', value: 'hasPreviousBan' },
    { label: 'Has Whitelisted ID', value: 'isWhitelisted' },
    { label: 'Has Profile Notes', value: 'hasNote' },
] as const;

function PlayerSearchBox() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSearchTypeDropdownOpen, setSearchTypeDropdownOpen] = useState(false);
    const [currSearchType, setCurrSearchType] = useState<string>('playerName');
    const [isFilterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

    const selectedSearchType = availableSearchTypes.find((type) => type.value === currSearchType);
    if (!selectedSearchType) throw new Error(`Invalid search type: ${currSearchType}`);

    const filterBtnMessage = selectedFilters.length ? `${selectedFilters.length} Filters` : 'No filters';
    return (
        <div className="p-4 mb-2 md:mb-4 md:rounded-xl border border-border bg-card text-card-foreground shadow-sm" >
            <div className=''>
                <div className="flex flex-wrap-reverse gap-2">
                    <div className='relative min-w-44 grow'>
                        <Input
                            type="text"
                            autoFocus
                            autoCapitalize='off'
                            autoCorrect='off'
                            ref={inputRef}
                            placeholder={selectedSearchType.placeholder}
                        />
                        {false ? (
                            <button
                                className="absolute right-2 inset-y-0 text-zinc-500 dark:text-zinc-400 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                            // onClick={() => setFilterString('')}
                            >
                                <XIcon />
                            </button>
                        ) : (
                            <div className="absolute right-2 inset-y-0 flex items-center text-zinc-500 dark:text-zinc-400 select-none pointer-events-none">
                                <InlineCode className="text-xs tracking-wide">ctrl+f</InlineCode>
                            </div>
                        )}
                    </div>

                    <div className="grow flex justify-between">
                        <div className='space-x-2 flex-nowrap'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isSearchTypeDropdownOpen}
                                        onClick={() => setSearchTypeDropdownOpen(!isSearchTypeDropdownOpen)}
                                        className="grow xs:w-36 justify-between border-input bg-black/5 dark:bg-black/30 hover:dark:bg-primary"
                                    >
                                        {selectedSearchType.label}
                                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='w-36'>
                                    <DropdownMenuLabel>Search Type</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={currSearchType} onValueChange={setCurrSearchType}>
                                        {availableSearchTypes.map((searchType) => (
                                            <DropdownMenuRadioItem key={searchType.value} value={searchType.value} className='cursor-pointer'>
                                                {searchType.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isFilterDropdownOpen}
                                        onClick={() => setFilterDropdownOpen(!isFilterDropdownOpen)}
                                        className="grow xs:w-44 justify-between border-input bg-black/5 dark:bg-black/30 hover:dark:bg-primary"
                                    >
                                        {filterBtnMessage}
                                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='w-44'>
                                    <DropdownMenuLabel>Search Filters</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {availableFilters.map((filter) => (
                                        <DropdownMenuCheckboxItem
                                            key={filter.value}
                                            checked={selectedFilters.includes(filter.value)}
                                            onCheckedChange={(checked) => {
                                                setSelectedFilters((prev) => {
                                                    if (checked) {
                                                        return [...prev, filter.value];
                                                    } else {
                                                        return prev.filter((f) => f !== filter.value);
                                                    }
                                                });
                                            }}
                                            // className="cursor-pointer hover:!bg-secondary hover:!text-current focus:!bg-secondary focus:!text-current"
                                            className="cursor-pointer"
                                        >
                                            {filter.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setSelectedFilters([])}
                                        className="cursor-pointer"
                                    >
                                        <FilterXIcon className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div>
                            <Button
                                variant="outline"
                                className="flex-grow"
                            >
                                More
                                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 px-1">
                    {selectedSearchType.description}
                </div>


            </div>
        </div>
    )
}

const PlayerSearchBoxMemo = memo(PlayerSearchBox);


function PlayerStats() {
    return (
        // <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 md:mb-6">
        <div className="grid px-2 md:px-0 gap-2 xs:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 md:mb-6">
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">Total Players</h3>
                    <UsersIcon className='hidden xs:block' />
                </div>
                <div className="text-xl xs:text-2xl font-bold">
                    123,456
                </div>
            </div>
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">Players Today</h3>
                    <CalendarPlusIcon className='hidden xs:block' />
                </div>
                <div className="text-xl xs:text-2xl font-bold">
                    1,234
                </div>
            </div>
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">New Players Today</h3>
                    <UserRoundPlusIcon className='hidden xs:block' />
                </div>
                <div className="text-xl xs:text-2xl font-bold">
                    +1,234
                </div>
            </div>
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">New Players This Week</h3>
                    <UserRoundPlusIcon className='hidden xs:block' />
                </div>
                <div className="text-xl xs:text-2xl font-bold">
                    +12,345
                </div>
            </div>
        </div>
    )
}

const PlayerStatsMemo = memo(PlayerStats);


export default function TmpTestTables() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [players, setPlayers] = useState<PlayerType[]>([]);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<PlayerSortingStateType>({ sortKey: 'tsJoined', sortDesc: true });
    const [dbPlayerCount, setDbPlayerCount] = useState(0);
    const [isResetting, setIsResetting] = useState(false);

    const fetchNextPage = async (reset?: boolean) => {
        console.log('fetchNextPage', players.length);
        setIsFetching(true);
        setLoadError(null);
        if (reset) {
            setIsResetting(true);
        }
        try {
            const offset = !reset && players.length ? {
                param: players[players.length - 1][sorting.sortKey],
                license: players[players.length - 1].license
            } : undefined;
            const {
                players: newPlayers,
                hasReachedEnd,
                dbPlayerCount
            } = await mockBackendApi({
                sortKey: sorting.sortKey,
                sortDesc: sorting.sortDesc,
                offset
            });
            setDbPlayerCount(dbPlayerCount);
            setHasReachedEnd(hasReachedEnd);
            setIsResetting(false);
            if (newPlayers.length) {
                // setPlayers((prev) => reset ? newPlayers : [...prev, ...newPlayers]);
                setPlayers((prev) => {
                    const newValue = reset ? newPlayers : [...prev, ...newPlayers];
                    console.log(`fetchNextPage ${prev.length} + ${newPlayers.length} = ${newValue.length}`);
                    return newValue;
                });
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
        // setPlayers([]);
        rowVirtualizer.scrollToIndex(0);
        fetchNextPage(true);
    }, [sorting]);


    return (<div
        className='flex flex-col min-w-96 2xl:mx-8'
        style={{ height: 'calc(100vh - 3.5rem - 1px - 2rem)' }}
    >
        {/* <div className="flex gap-3 items-center ">
            <Button onClick={() => rowVirtualizer.scrollToIndex(0)}>Scroll to top</Button>
            <Button onClick={() => fetchNextPage()}>fetchNextPage()</Button>
            <Button onClick={() => setPlayers([])}>Wipe</Button>
        </div> */}


        {/* <h2 className='px-2 md:px-0 mb-4 md:mb-6 text-lg md:text-2xl'>
            Players: {players.length}/{dbPlayerCount}
            <span className='text-fuchsia-600 pl-3'>({virtualItems.length - 1} rendered)</span>
        </h2> */}
        <PlayerStatsMemo />

        <PlayerSearchBoxMemo />
        <div
            className="w-full max-h-full min-h-96 overflow-auto border md:rounded-lg"
            style={{ overflowAnchor: "none" }}
        >
            <ScrollArea className="h-full" ref={scrollRef}>
                <table className='w-full caption-bottom text-sm table-fixed'>
                    <TableHeader>
                        <tr className='sticky top-0 z-10 bg-zinc-200 dark:bg-muted text-secondary-foreground text-base select-none shadow-md transition-colors'>
                            <th className='w-[50%]x py-2 px-4 font-light tracking-wider text-left text-muted-foreground'>
                                Display Name
                            </th>
                            <SortableTableHeader
                                label='Play Time'
                                sortKey='playTime'
                                sorting={sorting}
                                setSorting={setSorting}
                            />
                            <SortableTableHeader
                                label='First Joined'
                                sortKey='tsJoined'
                                sorting={sorting}
                                setSorting={setSorting}
                            />
                            <SortableTableHeader
                                label='Last Connection'
                                sortKey='tsLastConnection'
                                sorting={sorting}
                                setSorting={setSorting}
                            />
                        </tr>
                    </TableHeader>
                    <TableBody className={cn(isResetting && 'opacity-25')}>
                        {TopRowPad}
                        {virtualItems.map((virtualItem) => {
                            const isLastRow = virtualItem.index > players.length - 1;
                            return (
                                <TableRow key={virtualItem.key}>
                                    {isLastRow ? (
                                        <LastRow
                                            hasReachedEnd={hasReachedEnd}
                                            loadError={loadError}
                                            isFetching={isFetching}
                                            retryFetch={fetchNextPage}
                                        />
                                    ) : (
                                        <PlayerRow rowData={players[virtualItem.index]} />
                                    )}
                                </TableRow>
                            )
                        })}
                        {BottomRowPad}
                    </TableBody>
                </table>
            </ScrollArea>
        </div>
    </div>);
}
