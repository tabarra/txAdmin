import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { UsersIcon, UserRoundPlusIcon, CalendarPlusIcon } from 'lucide-react';
import PageCalloutRow from '@/components/PageCalloutRow';
import { PlayerSearchBox, PlayersSearchBoxReturnStateType } from './PlayersSearchBox';
import PlayersTable from './PlayersTable';
import { PlayersStatsResp, PlayersTableFiltersType, PlayersTableSearchType } from '@shared/playerApiTypes';
import { useBackendApi } from '@/hooks/fetch';


//Memoized components
const PlayerSearchBoxMemo = memo(PlayerSearchBox);
const PlayersTableMemo = memo(PlayersTable);
const PageCalloutRowMemo = memo(PageCalloutRow);


export default function PlayersPage() {
    const [calloutData, setCalloutData] = useState<PlayersStatsResp|undefined>(undefined);
    const [searchBoxReturn, setSearchBoxReturn] = useState<PlayersSearchBoxReturnStateType>({
        search: null,
        filters: [],
    });
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
        return {
            search: null,
            filters: [],
        } satisfies PlayersSearchBoxReturnStateType;
    }, []);


    return (<div
        className='flex flex-col min-w-96'
        style={{ height: 'calc(100vh - 3.5rem - 1px - 2rem)' }}
    >
        {/* <div
            //DEBUG component state
            className='w-full bg-black p-2'
            style={{ color: createRandomHslColor() }}
        >{JSON.stringify(searchBoxReturn)}</div> */}

        <PageCalloutRowMemo
            callouts={[
                {
                    label: 'Total Players',
                    value: calloutData?.total ?? false,
                    icon: <UsersIcon />,
                    prefix: ''
                },
                {
                    label: 'Players Today',
                    value: calloutData?.playedLast24h ?? false,
                    icon: <CalendarPlusIcon />,
                    prefix: ''
                },
                {
                    label: 'New Players Today',
                    value: calloutData?.joinedLast24h ?? false,
                    icon: <UserRoundPlusIcon />,
                    prefix: '+'
                },
                {
                    label: 'New Players This Week',
                    value: calloutData?.joinedLast7d ?? false,
                    icon: <UserRoundPlusIcon />,
                    prefix: '+'
                }
            ]}
        />
        <PlayerSearchBoxMemo
            doSearch={doSearch}
            initialState={initialState}
        />
        <PlayersTableMemo
            search={searchBoxReturn.search}
            filters={searchBoxReturn.filters}
        />
    </div>);
}
