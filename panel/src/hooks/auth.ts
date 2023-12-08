import { ApiLogoutResp, ReactAuthDataType } from '@shared/authApiTypes';
import { useMutation } from '@tanstack/react-query';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';


/**
 * Atoms
 */
const authDataAtom = atom<ReactAuthDataType | false>(window.txConsts.preAuth);
const isAuthenticatedAtom = atom((get) => !!get(authDataAtom))
const csrfTokenAtom = atom((get) => {
    const authData = get(authDataAtom);
    return authData ? authData.csrfToken : undefined;
});


/**
 * Hooks
 */
//Authentication hook, only re-renders on login/logout
export const useIsAuthenticated = () => {
    return useAtomValue(isAuthenticatedAtom);
};

//CSRF hook, only re-renders on login/logout
export const useCsrfToken = () => {
    return useAtomValue(csrfTokenAtom);
};

//Wipes auth data from the atom, this is triggered when an api pr page call returns a logout notice
//Since this is triggered by a logout notice, we don't need to bother doing a POST /auth/logout
export const useExpireAuthData = () => {
    const setAuthData = useSetAtom(authDataAtom);
    return (src = 'unknown') => {
        console.log(`Logout notice received from '${src}'. Wiping auth data.`);
        setAuthData(false);
        window.history.replaceState(null, '', '/login#expired');
    }
}

//Generic authentication hook, using it will cause your component to re-render on _any_ auth changes
export const useAuth = () => {
    const [authData, setAuthData] = useAtom(authDataAtom);

    const logoutMutation = useMutation<ApiLogoutResp>({
        mutationKey: ['auth'],
        mutationFn: () => fetch('/auth/logout', { method: 'POST' }).then(res => res.json()),
        onSuccess: (data) => {
            if (data.logout) {
                setAuthData(false);
                window.history.replaceState(null, '', '/login#logout');
            }
        },
    });

    return {
        authData,
        setAuthData,
        logout: {
            mutate: logoutMutation.mutate,
            isLoading: logoutMutation.isPending,
        }
    }
};
