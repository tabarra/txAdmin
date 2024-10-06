import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { UsersIcon, UserRoundPlusIcon, CalendarPlusIcon } from 'lucide-react';
import PageCalloutRow, { PageCalloutProps } from '@/components/PageCalloutRow';
import {
    PlayerSearchBox,
    PlayersSearchBoxReturnStateType,
    availableFilters,
    availableSearchTypes,
} from './PlayersSearchBox';
import PlayersTable from './PlayersTable';
import { PlayersStatsResp, PlayersTableFiltersType, PlayersTableSearchType } from '@shared/playerApiTypes';
import { useBackendApi } from '@/hooks/fetch';


//Memoized components
const PlayerSearchBoxMemo = memo(PlayerSearchBox);
const PlayersTableMemo = memo(PlayersTable);
const PageCalloutRowMemo = memo(PageCalloutRow);

//Helpers for storing search and filters in URL
const updateUrlSearchParams = (search: PlayersTableSearchType, filters: PlayersTableFiltersType) => {
    const newUrl = new URL(window.location.toString());
    if (search && search.value && search.type) {
        newUrl.searchParams.set("searchType", search.type);
        newUrl.searchParams.set("searchQuery", search.value);
    } else {
        newUrl.searchParams.delete("searchType");
        newUrl.searchParams.delete("searchQuery");
    }
    if (filters.length) {
        newUrl.searchParams.set("filters", filters.join(','));
    } else {
        newUrl.searchParams.delete("filters");
    }
    window.history.replaceState({}, "", newUrl);
}
const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const validTypes = availableSearchTypes.map(f => f.value) as string[];
    const searchType = params.get('searchType');
    const searchQuery = params.get('searchQuery');
    const validFilters = availableFilters.map(f => f.value) as string[];
    const searchFilters = params.get('filters')?.split(',').filter(f => validFilters.includes(f));
    return {
        search: searchQuery && searchType && validTypes.includes(searchType) ? {
            type: searchType,
            value: searchQuery,
        } : {
            type: availableSearchTypes[0].value,
            value: '',
        },
        filters: searchFilters ?? [],
    };
}


export default function PlayersPage() {
    const [calloutData, setCalloutData] = useState<PlayersStatsResp | undefined>(undefined);
    const [searchBoxReturn, setSearchBoxReturn] = useState<PlayersSearchBoxReturnStateType | undefined>(undefined);
    const statsApi = useBackendApi<PlayersStatsResp>({
        method: 'GET',
        path: '/player/stats',
        abortOnUnmount: true,
    });

    //Callout data
    useEffect(() => {
        statsApi({
            success(data, toastId) {
                setCalloutData(data);
            },
        })
    }, []);

    //PlayerSearchBox handlers
    const doSearch = useCallback((search: PlayersTableSearchType, filters: PlayersTableFiltersType) => {
        setSearchBoxReturn({ search, filters });
        updateUrlSearchParams(search, filters);
    }, []);
    const initialState = useMemo(getInitialState, []);


    const calloutRowData = useMemo(() => {
        const hasCalloutData = calloutData && !('error' in calloutData);
        return [
            {
                label: 'Total Players',
                value: hasCalloutData ? calloutData.total : false,
                icon: <UsersIcon />,
            },
            {
                label: 'Players Last 24h',
                value: hasCalloutData ? calloutData.playedLast24h : false,
                icon: <CalendarPlusIcon />,
            },
            {
                label: 'New Players Last 24h',
                value: hasCalloutData ? calloutData.joinedLast24h : false,
                icon: <UserRoundPlusIcon />,
                prefix: '+'
            },
            {
                label: 'New Players Last 7d',
                value: hasCalloutData ? calloutData.joinedLast7d : false,
                icon: <UserRoundPlusIcon />,
                prefix: '+'
            }
        ] satisfies PageCalloutProps[];
    }, [calloutData]);

    return (<div
        className='flex flex-col min-w-96 w-full'
        style={{ height: 'calc(100vh - 3.5rem - 1px - 2rem)' }}
    >
        {/* <div
            //DEBUG component state
            className='w-full bg-black p-2'
            style={{ color: createRandomHslColor() }}
        >{JSON.stringify(searchBoxReturn)}</div> */}

        <PageCalloutRowMemo callouts={calloutRowData} />

        <PlayerSearchBoxMemo
            doSearch={doSearch}
            initialState={initialState}
        />

        {searchBoxReturn ? (
            <PlayersTableMemo
                search={searchBoxReturn.search}
                filters={searchBoxReturn.filters}
            />
        ) : null}
    </div>);
}
