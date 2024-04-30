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
                    window.location.href = '/login#updated';
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
    if (window.location.hash === '#logout') {
        logoutMessage = 'Logged Out.';
    } else if (window.location.hash === '#expired') {
        logoutMessage = 'Session Expired.';
    } else if (window.location.hash === '#updated') {
        logoutMessage = 'txAdmin updated, please login again.';
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
                                <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="40.000000pt" height="50" viewBox="0 0 1024.000000 1024.000000" preserveAspectRatio="xMidYMid meet">

                                <g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill="#FFFF" stroke="none">
                                <path d="M1450 9258 c-47 -24 -90 -88 -90 -135 0 -25 2869 -8322 2902 -8390
                                11 -25 34 -52 56 -65 l37 -23 765 0 765 0 37 23 c22 13 45 40 56 65 33 68
                                2902 8365 2902 8390 0 47 -43 111 -90 135 l-44 22 -986 0 -986 0 -44 -22 c-34
                                -17 -50 -34 -67 -68 -11 -25 -362 -1230 -780 -2677 -417 -1448 -760 -2633
                                -763 -2633 -3 0 -346 1185 -763 2633 -418 1447 -769 2652 -780 2677 -17 34
                                -33 51 -67 68 l-44 22 -986 0 -986 0 -44 -22z m1894 -380 c14 -46 354 -1224
                                756 -2618 403 -1394 765 -2649 805 -2789 76 -262 87 -286 147 -317 57 -30 146
                                -10 186 41 26 33 54 122 222 710 72 253 149 519 170 590 35 118 649 2244 1071
                                3710 94 325 181 627 195 673 l25 82 784 0 c461 0 785 -4 785 -9 0 -8 -688
                                -2002 -1183 -3431 -41 -118 -143 -413 -227 -655 -259 -748 -483 -1396 -593
                                -1715 -58 -168 -252 -728 -431 -1244 -179 -517 -326 -941 -326 -943 0 -2 -274
                                -3 -609 -3 l-609 0 -26 72 c-14 40 -80 231 -146 423 -67 193 -163 472 -215
                                620 -51 149 -161 466 -243 705 -82 239 -540 1562 -1017 2940 -1119 3233 -1115
                                3221 -1115 3231 0 5 345 9 785 9 l784 0 25 -82z"></path>
                                </g>
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
