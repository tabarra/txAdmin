import { ApiLogoutResp, ReactAuthDataType } from '@shared/authApiTypes';
import { useMutation } from '@tanstack/react-query';
import { atom, useAtom, useAtomValue } from 'jotai';


/**
 * Atoms
 */
const authDataAtom = atom<ReactAuthDataType | false>(window.txConsts.preAuth);
const isAuthenticatedAtom = atom((get) => !!get(authDataAtom))


/**
 * Hooks
 */
//Authentication hook, only re-renders on login/logout
export const useIsAuthenticated = () => {
    return useAtomValue(isAuthenticatedAtom);
};

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
