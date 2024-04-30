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
                            </div>
                            : <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="51.12 12.29 1070.38 231.43"
                                className='w-[6rem] h-5'
                            >
                            <g transform="matrix(0.09765625 0 0 0.09765625 0 0)">
                                <g transform="matrix(0.1 0 -0 -0.1 0 1024)">
                                    <path d="M1450 9258C 1403 9234 1360 9170 1360 9123C 1360 9098 4229 801 4262 733C 4273 708 4296 681 4318 668L4318 668L4355 645L5120 645L5885 645L5922 668C 5944 681 5967 708 5978 733C 6011 801 8880 9098 8880 9123C 8880 9170 8837 9234 8790 9258L8790 9258L8746 9280L7760 9280L6774 9280L6730 9258C 6696 9241 6680 9224 6663 9190C 6652 9165 6301 7960 5883 6513C 5466 5065 5123 3880 5120 3880C 5117 3880 4774 5065 4357 6513C 3939 7960 3588 9165 3577 9190C 3560 9224 3544 9241 3510 9258L3510 9258L3466 9280L2480 9280L1494 9280L1450 9258zM3344 8878C 3358 8832 3698 7654 4100 6260C 4503 4866 4865 3611 4905 3471C 4981 3209 4992 3185 5052 3154C 5109 3124 5198 3144 5238 3195C 5264 3228 5292 3317 5460 3905C 5532 4158 5609 4424 5630 4495C 5665 4613 6279 6739 6701 8205C 6795 8530 6882 8832 6896 8878L6896 8878L6921 8960L7705 8960C 8166 8960 8490 8956 8490 8951C 8490 8943 7802 6949 7307 5520C 7266 5402 7164 5107 7080 4865C 6821 4117 6597 3469 6487 3150C 6429 2982 6235 2422 6056 1906C 5877 1389 5730 965 5730 963C 5730 961 5456 960 5121 960L5121 960L4512 960L4486 1032C 4472 1072 4406 1263 4340 1455C 4273 1648 4177 1927 4125 2075C 4074 2224 3964 2541 3882 2780C 3800 3019 3342 4342 2865 5720C 1746 8953 1750 8941 1750 8951C 1750 8956 2095 8960 2535 8960L2535 8960L3319 8960L3344 8878z" stroke="none" fill="#000000" fill-rule="nonzero" />
                                </g>
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
