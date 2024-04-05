import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { UsersIcon, UserRoundPlusIcon, CalendarPlusIcon } from 'lucide-react';
import PageCalloutRow, { PageCalloutProps } from '@/components/PageCalloutRow';
import { PlayerSearchBox, PlayersSearchBoxReturnStateType } from './PlayersSearchBox';
import PlayersTable from './PlayersTable';
import { PlayersStatsResp, PlayersTableFiltersType, PlayersTableSearchType } from '@shared/playerApiTypes';
import { useBackendApi } from '@/hooks/fetch';
import { defaultFilters, defaultSearch } from './PlayersPageConsts';


//Memoized components
const PlayerSearchBoxMemo = memo(PlayerSearchBox);
const PlayersTableMemo = memo(PlayersTable);
const PageCalloutRowMemo = memo(PageCalloutRow);


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
    }, []);

    
    const initialState = useMemo(() => {
        const url = new URL(window.location.href);
        const query = url.searchParams.get('q');
        const type = url.searchParams.get('type');
        const filters = url.searchParams.get('filters');
        const search: PlayersTableSearchType = {
            value: query ?? defaultSearch.value,
            type: type ?? defaultSearch.type,
        }

        return {
            search: (query || type) ? search : null,
            filters: filters ? filters.split(',') : defaultFilters,
        } satisfies PlayersSearchBoxReturnStateType;
    }, []);


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
