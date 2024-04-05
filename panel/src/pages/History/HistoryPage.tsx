import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangleIcon, GavelIcon } from 'lucide-react';
import PageCalloutRow, { PageCalloutProps } from '@/components/PageCalloutRow';
import { HistorySearchBox, HistorySearchBoxReturnStateType } from './HistorySearchBox';
import HistoryTable from './HistoryTable';
import { HistoryStatsResp, HistoryTableSearchType } from '@shared/historyApiTypes';
import { useBackendApi } from '@/hooks/fetch';
import { createRandomHslColor } from '@/lib/utils';
import { defaultSearch } from './HistoryPageConsts';


//Memoized components
const HistorySearchBoxMemo = memo(HistorySearchBox);
const HistoryTableMemo = memo(HistoryTable);
const PageCalloutRowMemo = memo(PageCalloutRow);


export default function HistoryPage() {
    const [calloutData, setCalloutData] = useState<HistoryStatsResp | undefined>(undefined);
    const [searchBoxReturn, setSearchBoxReturn] = useState<HistorySearchBoxReturnStateType | undefined>(undefined);
    const statsApi = useBackendApi<HistoryStatsResp>({
        method: 'GET',
        path: '/history/stats',
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

    //HistorySearchBox handlers
    const doSearch = useCallback((
        search: HistoryTableSearchType,
        filterbyType: string | undefined,
        filterbyAdmin: string | undefined
    ) => {
        setSearchBoxReturn({ search, filterbyType, filterbyAdmin });
    }, []);
    const initialState = useMemo(() => {
        const url = new URL(window.location.href);
        const query = url.searchParams.get('q');
        const type = url.searchParams.get('type');
        const actionType = url.searchParams.get('actionType');
        const admin = url.searchParams.get('byAdmin');
        const search: HistoryTableSearchType = {
            value: query ?? defaultSearch.value,
            type: type ?? defaultSearch.type,
        }

        return {
            search: (query || type) ? search : null,
            filterbyType: actionType ?? undefined,
            filterbyAdmin: admin ?? undefined,
        } satisfies HistorySearchBoxReturnStateType;
    }, []);

    const calloutRowData = useMemo(() => {
        const hasCalloutData = calloutData && !('error' in calloutData);
        return [
            {
                label: 'Total Warns',
                value: hasCalloutData ? calloutData.totalWarns : false,
                icon: <AlertTriangleIcon />,
            },
            {
                label: 'New Warns Last 7d',
                value: hasCalloutData ? calloutData.warnsLast7d : false,
                icon: <AlertTriangleIcon />,
                prefix: '+'
            },
            {
                label: 'Total Bans',
                value: hasCalloutData ? calloutData.totalBans : false,
                icon: <GavelIcon />,
            },
            {
                label: 'New Bans Last 7d',
                value: hasCalloutData ? calloutData.bansLast7d : false,
                icon: <GavelIcon />,
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

        {calloutData && !('error' in calloutData) ? (
            <HistorySearchBoxMemo
                doSearch={doSearch}
                initialState={initialState}
                adminStats={calloutData.groupedByAdmins}
            />
        ) : null}

        {searchBoxReturn ? (
            <HistoryTableMemo
                search={searchBoxReturn.search}
                filterbyType={searchBoxReturn.filterbyType}
                filterbyAdmin={searchBoxReturn.filterbyAdmin}
            />
        ) : null}
    </div>);
}
