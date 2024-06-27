import { throttle } from "throttle-debounce";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsUpDownIcon, XIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import InlineCode from '@/components/InlineCode';
import { useEventListener } from "usehooks-ts";
import { Link } from "wouter";
import { useAuth } from "@/hooks/auth"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { HistoryTableSearchType } from "@shared/historyApiTypes";
import { DynamicNewBadge } from "@/components/DynamicNewBadge";


/**
 * Helpers
 */
const availableSearchTypes = [
    {
        value: 'actionId',
        label: 'Action ID',
        placeholder: 'XXXX-XXXX',
        description: 'Search actions by their ID.'
    },
    {
        value: 'reason',
        label: 'Reason',
        placeholder: 'Enter part of the reason to search for',
        description: 'Search actions by their reason contents.'
    },
    {
        value: 'identifiers',
        label: 'Player IDs',
        placeholder: 'License, Discord, Steam, etc.',
        description: 'Search actions by their player IDs separated by a comma.'
    },
] as const;

const SEARCH_ANY_STRING = '!any';

//FIXME: this doesn't require exporting, but HMR doesn't work without it
// eslint-disable-next-line @typescript-eslint/no-explicit-any, react-refresh/only-export-components
export const throttleFunc = throttle(1250, (func: any) => {
    func();
}, { noLeading: true });



/**
 * Component
 */
export type HistorySearchBoxReturnStateType = {
    search: HistoryTableSearchType;
    filterbyType?: string;
    filterbyAdmin?: string;
}

type HistorySearchBoxProps = {
    doSearch: (search: HistoryTableSearchType, filterbyType: string | undefined, filterbyAdmin: string | undefined) => void;
    initialState: HistorySearchBoxReturnStateType;
    adminStats: {
        name: string;
        actions: number;
    }[];
};

export function HistorySearchBox({ doSearch, initialState, adminStats }: HistorySearchBoxProps) {
    const { authData } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSearchTypeDropdownOpen, setSearchTypeDropdownOpen] = useState(false);
    const [currSearchType, setCurrSearchType] = useState<string>(initialState.search?.type || 'actionId');
    const [hasSearchText, setHasSearchText] = useState(!!initialState.search?.value);
    const [typeFilter, setTypeFilter] = useState(initialState.filterbyType ?? SEARCH_ANY_STRING);
    const [adminNameFilter, setAdminNameFilter] = useState(initialState.filterbyAdmin ?? SEARCH_ANY_STRING);

    const updateSearch = () => {
        if (!inputRef.current) return;
        const searchValue = inputRef.current.value.trim();
        const effectiveTypeFilter = typeFilter !== SEARCH_ANY_STRING ? typeFilter : undefined;
        const effectiveAdminNameFilter = adminNameFilter !== SEARCH_ANY_STRING ? adminNameFilter : undefined;
        if (searchValue.length) {
            doSearch(
                { value: searchValue, type: currSearchType },
                effectiveTypeFilter,
                effectiveAdminNameFilter,
            );
        } else {
            doSearch(
                null,
                effectiveTypeFilter,
                effectiveAdminNameFilter,
            );
        }
    }

    //Call onSearch when params change
    useEffect(() => {
        updateSearch();
    }, [currSearchType, typeFilter, adminNameFilter]);

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
    if (!authData) throw new Error(`authData is not available`);
    const filteredAdmins = useMemo(() => {
        return adminStats.filter((admin) => admin.name !== authData.name)
    }, [adminStats, authData.name]);
    const selfActionCount = useMemo(() => {
        return adminStats.find((admin) => admin.name === authData.name)?.actions || 0;
    }, [adminStats, authData.name]);
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


                    <Select defaultValue={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-36 grow md:grow-0" >
                            <SelectValue placeholder="Filter by admin" />
                        </SelectTrigger>
                        <SelectContent className="px-0">
                            <SelectItem value={SEARCH_ANY_STRING} className="cursor-pointer">
                                Any type
                            </SelectItem>
                            <SelectSeparator />
                            <SelectItem value={'ban'} className="cursor-pointer">
                                Bans
                            </SelectItem>
                            <SelectItem value={'warn'} className="cursor-pointer">
                                Warns
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Select defaultValue={adminNameFilter} onValueChange={setAdminNameFilter}>
                        <SelectTrigger className="w-36 grow md:grow-0" >
                            <SelectValue placeholder="Filter by admin" />
                        </SelectTrigger>
                        <SelectContent className="px-0">
                            <SelectItem value={SEARCH_ANY_STRING} className="cursor-pointer">
                                By any admin
                            </SelectItem>
                            <SelectItem value={authData.name} className="cursor-pointer">
                                {authData.name} <span className="opacity-50">({selfActionCount})</span>
                            </SelectItem>

                            <SelectSeparator />
                            {filteredAdmins.map((admin) => (
                                <SelectItem
                                    className="cursor-pointer"
                                    key={admin.name}
                                    value={admin.name}
                                >
                                    {admin.name} <span className="opacity-50">({admin.actions})</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex justify-end flex-grow">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="grow md:grow-0">
                                    More
                                    <DynamicNewBadge featName="banTemplates" durationDays={7} />
                                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem className="h-10 pl-1 pr-2 py-2" asChild>
                                    <Link href="/system/master-actions#cleandb" className="cursor-pointer">
                                        <ExternalLinkIcon className="inline mr-1 h-4" />
                                        Bulk Remove
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="h-10 pl-1 pr-2 py-2" asChild>
                                    <Link href="/settings/ban-templates" className="cursor-pointer">
                                        <ExternalLinkIcon className="inline mr-1 h-4" />
                                        Ban Templates
                                        <DynamicNewBadge featName="banTemplates" durationDays={7} />
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
