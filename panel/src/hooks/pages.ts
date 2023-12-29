import { atom, useSetAtom } from 'jotai';
import { atomEffect } from 'jotai-effect'
import faviconDefault from '/favicon_default.svg?url';
import faviconOnline from '/favicon_online.svg?url';
import faviconPartial from '/favicon_partial.svg?url';
import faviconOffline from '/favicon_offline.svg?url';
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
const DEFAULT_TITLE = 'txAdmin';
const faviconEl = document.getElementById('favicon') as HTMLLinkElement;
const pageTitleAtom = atom(DEFAULT_TITLE);

export const useSetPageTitle = () => {
    const setPageTitle = useSetAtom(pageTitleAtom);
    return (title?: string) => {
        if (title) {
            setPageTitle(title);
        } else {
            // probably logout, pageTitleWatcher is not watching!
            setPageTitle(DEFAULT_TITLE);
            document.title = DEFAULT_TITLE;
            faviconEl.href = faviconDefault;
        }
    };
}

export const pageTitleWatcher = atomEffect((get, set) => {
    if (!window.txConsts.isWebInterface) return;
    const pageTitle = get(pageTitleAtom);
    const globalStatus = get(globalStatusAtom);
    const playerCount = get(playerCountAtom);

    if (!globalStatus) {
        faviconEl.href = faviconDefault;
        document.title = DEFAULT_TITLE;
    } else {
        if (globalStatus.server.status === 'ONLINE') {
            faviconEl.href = faviconOnline;
        } else if (globalStatus.server.status === 'PARTIAL') {
            faviconEl.href = faviconPartial;
        } else {
            faviconEl.href = faviconOffline;
        }
        document.title = `(${playerCount}) ${globalStatus.server.name} · ${pageTitle}`;
    }
});
