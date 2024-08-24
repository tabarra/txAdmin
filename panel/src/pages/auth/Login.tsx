import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from "lucide-react";
import { ApiOauthRedirectResp, ApiVerifyPasswordReq, ApiVerifyPasswordResp } from '@shared/authApiTypes';
import { useAuth } from '@/hooks/auth';
import './components/cfxreLoginButton.css';
import { useLocation } from "wouter";

export enum LogoutReasonHash {
    NONE = '',
    LOGOUT = '#logout',
    EXPIRED = '#expired',
    UPDATED = '#updated',
    MASTER_ALREADY_SET = '#master_already_set',
}

export default function Login() {
    const { setAuthData } = useAuth();
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const setLocation = useLocation()[1];

    const onError = (error: Error) => {
        if (error.message.startsWith('NetworkError')) {
            setErrorMessage('Network error. If you closed txAdmin, please restart it and try again.');
        } else {
            setErrorMessage(error.message);
        }
    }

    const onErrorResponse = (error: string) => {
        if (error === 'no_admins_setup') {
            setErrorMessage('No admins set up. Redirecting...');
            setLocation('/addMaster/pin');
        } else {
            setErrorMessage(error);
        }
    }

    const redirectMutation = useMutation<ApiOauthRedirectResp>({
        mutationKey: ['oauthRedirect'],
        mutationFn: () => {
            const url = `/auth/cfxre/redirect?origin=${encodeURIComponent(window.location.origin)}`;
            return fetch(url).then(res => res.json())
        },
        onError,
        onSuccess: (data) => {
            if ('error' in data) {
                onErrorResponse(data.error);
            } else {
                console.log('Redirecting to', data.authUrl);
                window.location.href = data.authUrl;
            }
        },
    });

    const submitMutation = useMutation<
        ApiVerifyPasswordResp,
        Error,
        ApiVerifyPasswordReq
    >({
        mutationKey: ['auth'],
        mutationFn: ({ username, password }) => fetch(`/auth/password?uiVersion=${encodeURIComponent(window.txConsts.txaVersion)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(res => res.json()),
        onError,
        onSuccess: (data) => {
            if ('error' in data) {
                if (data.error === 'refreshToUpdate') {
                    window.location.href = `/login${LogoutReasonHash.UPDATED}`;
                    window.location.reload();
                } else {
                    onErrorResponse(data.error);
                }
            } else {
                setAuthData(data);
            }
        },
    });

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        submitMutation.mutate({
            username: usernameRef.current?.value || '',
            password: passwordRef.current?.value || '',
        });
    };

    let logoutMessage;
    if (window.location.hash === LogoutReasonHash.LOGOUT) {
        logoutMessage = 'Logged Out.';
    } else if (window.location.hash === LogoutReasonHash.EXPIRED) {
        logoutMessage = 'Session Expired.';
    } else if (window.location.hash === LogoutReasonHash.UPDATED) {
        logoutMessage = 'txAdmin updated, please login again.';
    } else if (window.location.hash === LogoutReasonHash.MASTER_ALREADY_SET) {
        logoutMessage = 'Master account already configured. Please login instead.';
    }
    const displayMessage = errorMessage ?? logoutMessage;

    //Prefill username/password if dev pass enabled
    useEffect(() => {
        try {
            const rawLocalStorageStr = localStorage.getItem('authCredsAutofill');
            if (rawLocalStorageStr) {
                const [user, pass] = JSON.parse(rawLocalStorageStr);
                usernameRef.current!.value = user ?? '';
                passwordRef.current!.value = pass ?? '';
            }
        } catch (error) {
            console.error('Username/Pass autofill failed', error);
        }
    }, []);


    return (
        <form onSubmit={handleSubmit} className='w-full'>
            <CardHeader className="space-y-1">
                <CardTitle className="text-3xl">Login</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div>
                    <button
                        type='button'
                        className='cfxrebtn'
                        onClick={() => { redirectMutation.mutate() }}
                        disabled={redirectMutation.isPending}
                    >
                        {redirectMutation.isPending
                            ? <div className='w-[6rem]'>
                                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                            </div>
                            : <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="51.12 12.29 1070.38 231.43"
                                className='w-[6rem] h-5'
                            >
                                <path fill="#fff" d="M555.37 202.281c-12.725 2.072-36.4 4.44-51.493 4.44-39.952 0-47.35-19.533-47.35-75.17 0-57.412 9.174-75.464 46.462-75.464 14.501 0 39.064 2.367 52.382 4.735l1.183-26.635c-12.725-2.96-36.992-7.398-58.004-7.398-60.668 0-76.057 31.665-76.057 104.763 0 69.25 14.205 104.467 76.057 104.467 18.94 0 43.8-3.552 57.708-6.511l-.887-27.227zm69.547-89.966h39.064V84.793h-39.064v-9.174c0-20.42 4.143-26.93 17.756-26.93 9.174 0 23.675.591 23.675.591l.296-26.043c0-.296-21.9-3.255-31.961-3.255-30.778 0-41.728 12.725-41.728 55.34v9.471H575.79v27.522h17.165v120.448h31.962V112.315zm49.422-27.522 42.911 73.69-42.911 74.28h34.33l29.001-50.606 29.298 50.606h34.33l-44.096-75.169 44.096-72.801h-34.33l-29.298 51.198-29.002-51.198h-34.33zM824.38 190.148h34.625v42.615H824.38zm72.21 42.615h32.257V129.48s23.084-10.358 50.014-15.685V81.538c-25.155 4.735-50.31 21.011-50.31 21.011V84.793h-31.961v147.97zm164.839-24.859c-24.563 0-33.441-11.837-33.737-35.513h91.741l2.072-23.083c0-46.167-20.716-67.77-62.148-67.77-40.84 0-64.219 24.563-64.219 78.72 0 52.085 17.165 75.76 61.556 75.76 26.043 0 59.78-6.806 59.78-6.806l-.592-23.971s-31.074 2.663-54.453 2.663zm-34.033-60.372c.296-28.41 10.062-39.36 31.961-39.36 21.604 0 30.482 9.766 30.482 39.36h-62.443zM242.957 146.08v-.723l-4.34-57.857c-.12-1.567-.783-2.923-1.989-4.068s-2.59-1.718-4.158-1.718h-33.63c-1.567 0-2.953.573-4.158 1.718-1.206 1.145-1.868 2.5-1.989 4.068l-4.34 57.857v.723c-.12 1.447.362 2.653 1.447 3.616 1.085.964 2.35 1.447 3.797 1.447h44.116c1.447 0 2.712-.483 3.797-1.447 1.085-.963 1.568-2.17 1.447-3.616zm137.23 84.436c0 8.8-2.772 13.199-8.317 13.199H244.584c1.567 0 2.893-.574 3.977-1.718 1.085-1.145 1.568-2.5 1.447-4.068l-3.616-46.286c-.121-1.568-.783-2.924-1.99-4.068s-2.59-1.718-4.158-1.718h-49.178c-1.567 0-2.953.573-4.159 1.718-1.205 1.144-1.868 2.5-1.989 4.068l-3.616 46.286c-.12 1.567.362 2.923 1.447 4.068s2.41 1.718 3.977 1.718H59.44c-5.544 0-8.317-4.4-8.317-13.2 0-6.508 1.567-13.5 4.701-20.972l75.396-188.76c.964-2.29 2.53-4.279 4.7-5.966 2.17-1.688 4.46-2.532 6.871-2.532h61.293c-1.567 0-2.953.573-4.159 1.718-1.205 1.145-1.868 2.501-1.989 4.068l-2.712 34.715c-.12 1.687.362 3.073 1.447 4.158 1.085 1.085 2.41 1.627 3.977 1.627h30.014c1.567 0 2.893-.542 3.978-1.627 1.084-1.085 1.567-2.471 1.446-4.158l-2.712-34.715c-.121-1.567-.783-2.923-1.989-4.068s-2.59-1.718-4.158-1.718h61.292c2.41 0 4.701.844 6.87 2.532 2.17 1.687 3.738 3.676 4.702 5.966l75.395 188.76c3.133 7.472 4.7 14.464 4.7 20.973z" />
                            </svg>
                        }
                    </button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            OR
                        </span>
                    </div>
                </div>
                <div className='flex flex-col gap-4'>
                    <div className="grid gap-2">
                        <Label htmlFor="frm-login">Login</Label>
                        <Input
                            id="frm-login" type="text" ref={usernameRef}
                            placeholder="username"
                            autoCapitalize='off' autoComplete='off' required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="frm-password">Password</Label>
                        <Input
                            id="frm-password" type="password" ref={passwordRef}
                            placeholder='password'
                            autoCapitalize='off' autoComplete='off' required
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className='flex-col pb-0'>
                <Button className="w-full" disabled={submitMutation.isPending}>
                    {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                </Button>
                <div className="text-destructive mt-2">
                    {displayMessage ?? <>&nbsp;</>}
                </div>
            </CardFooter>
        </form>
    );
}
