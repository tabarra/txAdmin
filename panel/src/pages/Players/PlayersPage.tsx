import { memo, useCallback, useMemo, useState } from 'react';
import { createRandomHslColor } from '@/lib/utils';
import { UsersIcon, UserRoundPlusIcon, CalendarPlusIcon } from 'lucide-react';
import PageCalloutRow, { PageCalloutProps } from '@/components/PageCalloutRow';
import { PlayerSearchBox, PlayersSearchBoxReturnStateType } from './PlayersSearchBox';
import PlayersTable from './PlayersTable';
import { PlayersTableFiltersType, PlayersTableSearchType } from '@shared/playerApiTypes';




const callouts: PageCalloutProps[] = [
    {
        label: 'Total Players',
        value: 123456,
        icon: <UsersIcon />,
        prefix: ''
    },
    {
        label: 'Players Today',
        value: 1234,
        icon: <CalendarPlusIcon />,
        prefix: ''
    },
    {
        label: 'New Players Today',
        value: 1234,
        icon: <UserRoundPlusIcon />,
        prefix: '+'
    },
    {
        label: 'New Players This Week',
        value: 12345,
        icon: <UserRoundPlusIcon />,
        prefix: '+'
    }
]


const PlayerSearchBoxMemo = memo(PlayerSearchBox);
const PlayersTableMemo = memo(PlayersTable);
const PageCalloutRowMemo = memo(PageCalloutRow);


export default function PlayersPage() {
    const [searchBoxReturn, setSearchBoxReturn] = useState<PlayersSearchBoxReturnStateType>({
        search: null,
        filters: [],
    });

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
            callouts={callouts}
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
