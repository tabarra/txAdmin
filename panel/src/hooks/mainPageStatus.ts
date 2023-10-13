import { atom, useSetAtom } from 'jotai';

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
