import { throttle } from "throttle-debounce";
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsUpDownIcon, FilterXIcon, XIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
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
import { PlayersTableFiltersType, PlayersTableSearchType } from "@shared/playerApiTypes";
import { useEventListener } from "usehooks-ts";
import { Link } from "wouter";
import { DynamicNewBadge } from "@/components/DynamicNewBadge";


/**
 * Helpers
 */
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
        label: 'Player IDs',
        placeholder: 'License, Discord, Steam, etc.',
        description: 'Search players by their IDs separated by a comma.'
    },
] as const;

const availableFilters = [
    { label: 'Is Admin', value: 'isAdmin' },
    { label: 'Is Online', value: 'isOnline' },
    // { label: 'Is Banned', value: 'isBanned' },
    // { label: 'Has Previous Ban', value: 'hasPreviousBan' },
    { label: 'Has Whitelisted ID', value: 'isWhitelisted' },
    { label: 'Has Profile Notes', value: 'hasNote' },
] as const;

//FIXME: this doesn't require exporting, but HMR doesn't work without it
// eslint-disable-next-line @typescript-eslint/no-explicit-any, react-refresh/only-export-components
export const throttleFunc = throttle(1250, (func: any) => {
    func();
}, { noLeading: true });



/**
 * Component
 */
export type PlayersSearchBoxReturnStateType = {
    search: PlayersTableSearchType;
    filters: PlayersTableFiltersType;
}

type PlayerSearchBoxProps = {
    doSearch: (search: PlayersTableSearchType, filters: PlayersTableFiltersType) => void;
    initialState: PlayersSearchBoxReturnStateType;
};

export function PlayerSearchBox({ doSearch, initialState }: PlayerSearchBoxProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSearchTypeDropdownOpen, setSearchTypeDropdownOpen] = useState(false);
    const [isFilterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [currSearchType, setCurrSearchType] = useState<string>(initialState.search?.type || 'playerName');
    const [selectedFilters, setSelectedFilters] = useState<string[]>(initialState.filters);
    const [hasSearchText, setHasSearchText] = useState(!!initialState.search?.value);

    const updateSearch = () => {
        if (!inputRef.current) return;
        const searchValue = inputRef.current.value.trim();
        if (searchValue.length) {
            doSearch({ value: searchValue, type: currSearchType }, selectedFilters);
        } else {
            doSearch(null, selectedFilters);
        }
    }

    //Call onSearch when params change
    useEffect(() => {
        updateSearch();
    }, [currSearchType, selectedFilters]);

    //Input handlers
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            throttleFunc.cancel({ upcomingOnly: true });
            updateSearch();
        } else if (e.key === 'Escape') {
            inputRef.current!.value = '';
            throttleFunc(updateSearch);
            setHasSearchText(false);
        } else {
            throttleFunc(updateSearch);
            setHasSearchText(true);
        }
    };

    const clearSearchBtn = () => {
        inputRef.current!.value = '';
        throttleFunc.cancel({ upcomingOnly: true });
        updateSearch();
        setHasSearchText(false);
    };

    const filterSelectChange = (filter: string, checked: boolean) => {
        if (checked) {
            setSelectedFilters((prev) => [...prev, filter]);
        } else {
            setSelectedFilters((prev) => prev.filter((f) => f !== filter));
        }
    }

    //Search hotkey
    useEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
            inputRef.current?.focus();
            e.preventDefault();
        }
    });

    //It's render time! 🎉
    const selectedSearchType = availableSearchTypes.find((type) => type.value === currSearchType);
    if (!selectedSearchType) throw new Error(`Invalid search type: ${currSearchType}`);
    const filterBtnMessage = selectedFilters.length
        ? `${selectedFilters.length} Filter${selectedFilters.length > 1 ? 's' : ''}`
        : 'No filters';
    return (
        <div className="p-4 mb-2 md:mb-4 md:rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-wrap-reverse gap-2">
                <div className='relative min-w-44 grow'>
                    <Input
                        type="text"
                        autoFocus
                        autoCapitalize='off'
                        autoCorrect='off'
                        ref={inputRef}
                        placeholder={selectedSearchType.placeholder}
                        onKeyDown={handleInputKeyDown}
                    />
                    {hasSearchText ? (
                        <button
                            className="absolute right-2 inset-y-0 text-zinc-500 dark:text-zinc-400 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                            onClick={clearSearchBtn}
                        >
                            <XIcon />
                        </button>
                    ) : (
                        <div className="absolute right-2 inset-y-0 flex items-center text-zinc-500 dark:text-zinc-400 select-none pointer-events-none">
                            <InlineCode className="text-xs tracking-wide">ctrl+f</InlineCode>
                        </div>
                    )}
                </div>

                <div className="grow flex content-start gap-2 flex-wrap">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isSearchTypeDropdownOpen}
                                onClick={() => setSearchTypeDropdownOpen(!isSearchTypeDropdownOpen)}
                                className="xs:w-48 justify-between border-input bg-black/5 dark:bg-black/30 hover:dark:bg-primary grow md:grow-0"
                            >
                                Search by {selectedSearchType.label}
                                <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='w-48'>
                            <DropdownMenuLabel>Search Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={currSearchType} onValueChange={setCurrSearchType}>
                                {availableSearchTypes.map((searchType) => (
                                    <DropdownMenuRadioItem
                                        key={searchType.value}
                                        value={searchType.value}
                                        className='cursor-pointer'
                                    >
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
                                className="xs:w-44 justify-between border-input bg-black/5 dark:bg-black/30 hover:dark:bg-primary grow md:grow-0"
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
                                    className="cursor-pointer"
                                    onCheckedChange={(checked) => {
                                        filterSelectChange(filter.value, checked);
                                    }}

                                >
                                    {filter.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => setSelectedFilters([])}
                            >
                                <FilterXIcon className="mr-2 h-4 w-4" />
                                Clear Filters
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex justify-end flex-grow">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="">
                                <Button variant="outline" className="grow md:grow-0">
                                    More
                                    <DynamicNewBadge featName="banIdentifiersPage" durationDays={3} />
                                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem className="h-10 pl-1 pr-2 py-2" asChild>
                                    <Link href="/ban-identifiers" className="cursor-pointer">
                                        <ExternalLinkIcon className="inline mr-1 h-4" />
                                        Ban Identifiers
                                        <DynamicNewBadge featName="banIdentifiersPage" durationDays={3} />
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="h-10 pl-1 pr-2 py-2" asChild>
                                    <Link href="/system/master-actions#cleandb" className="cursor-pointer">
                                        <ExternalLinkIcon className="inline mr-1 h-4" />
                                        Prune Players/HWIDs
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1 px-1">
                {selectedSearchType.description}
            </div>
        </div>
    )
}
