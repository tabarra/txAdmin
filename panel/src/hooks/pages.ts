import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomEffect } from 'jotai-effect'
import faviconDefault from '/favicon_default.svg';
import faviconOnline from '/favicon_online.svg';
import faviconPartial from '/favicon_partial.svg';
import faviconOffline from '/favicon_offline.svg';
import { globalStatusAtom } from './status';
import { playerCountAtom } from './playerlist';

/**
 * This atom is used to change the key of the main page error boundry, which also resets the router 
 * as a side effect. This is used to reset the page that errored as well as resetting the current 
 * page when the user clicks on the active menu link.
 */
export const contentRefreshKeyAtom = atom(0);

//Hook to refresh content
export const useContentRefresh = () => {
    const setContentRefreshKey = useSetAtom(contentRefreshKeyAtom);
    return () => setContentRefreshKey(Math.random());
};

/**
 * This atom describes if the main page is in error state or not.
 * When the page is in error, clicking on any menu link will reset the error boundry and router,
 * therefore also resetting the page that errored.
 */
export const pageErrorStatusAtom = atom(false);



/**
 * Page title management
 */
const faviconEl = document.getElementById('favicon') as HTMLLinkElement;
const pageTitleAtom = atom('txAdmin');

export const useSetPageTitle = () => {
    const setPageTitle = useSetAtom(pageTitleAtom);
    return (title = 'txAdmin') => setPageTitle(title);
}

export const pageTitleWatcher = atomEffect((get, set) => {
    if (!window.txConsts.isWebInterface) return;
    const pageTitle = get(pageTitleAtom);
    const globalStatus = get(globalStatusAtom);
    const playerCount = get(playerCountAtom);

    if (!globalStatus) {
        faviconEl.href = faviconDefault;
        document.title = 'txAdmin';
    } else {
        if(globalStatus.server.status === 'ONLINE'){
            faviconEl.href = faviconOnline;
        }else if(globalStatus.server.status === 'PARTIAL'){
            faviconEl.href = faviconPartial;
        } else {
            faviconEl.href = faviconOffline;
        }
        document.title = `(${playerCount}) ${globalStatus.server.name} · ${pageTitle}`;
    }

    return () => {
        faviconEl.href = faviconDefault;
        document.title = 'txAdmin';
    }
});
