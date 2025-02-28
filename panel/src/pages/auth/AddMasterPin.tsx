import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ApiAddMasterPinReq, ApiAddMasterPinResp } from "@shared/authApiTypes";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { LogoutReasonHash } from "./Login";
import { fetchWithTimeout } from "@/hooks/fetch";
import { AuthError, processFetchError, type AuthErrorData } from "./errors";

export default function AddMasterPin() {
    const pinRef = useRef<HTMLInputElement>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [messageText, setMessageText] = useState<string | undefined>();
    const [isMessageError, setIsMessageError] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState(false);
    const [fullPageError, setFullPageError] = useState<AuthErrorData | undefined>();

    const submitPin = async () => {
        try {
            setIsMessageError(false);
            setMessageText(undefined);
            setIsFetching(true);
            const data = await fetchWithTimeout<ApiAddMasterPinResp, ApiAddMasterPinReq>(
                `/auth/addMaster/pin`,
                {
                    method: 'POST',
                    body: {
                        pin: pinRef.current?.value || '0000',
                        origin: window.location.origin,
                    },
                }
            );
            if ('error' in data) {
                if (data.error === 'master_already_set') {
                    setIsRedirecting(true);
                    setFullPageError({ errorCode: data.error });
                } else {
                    setIsMessageError(true);
                    setMessageText(data.error);
                }
            } else {
                setIsRedirecting(true);
                console.log('Redirecting to', data.authUrl);
                window.location.href = data.authUrl;
            }
        } catch (error) {
            setIsMessageError(true);
            const { errorTitle, errorMessage } = processFetchError(error);
            setMessageText(`${errorTitle}: ${errorMessage}`);
        } finally {
            setIsFetching(false);
        }
    }

    useEffect(() => {
        if (/^#\d{4}$/.test(window.location.hash)) {
            setMessageText('Auto-filled ✔');
            pinRef.current!.value = window.location.hash.substring(1);
        }
    }, []);

    if (fullPageError) {
        return <AuthError error={fullPageError} />
    }

    const disableInput = isFetching || isRedirecting;
    return (
        <form
            onSubmit={(e) => {
                e?.preventDefault();
                submitPin();
            }}
            className='w-full'
        >
            <CardHeader className="space-y-1">
                <CardTitle className="text-3xl">No Cfx.re account linked</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                    Type in the PIN from the terminal.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
                <span className={cn(
                    'text-center',
                    isMessageError ? 'text-destructive' : 'text-success',
                )}>
                    {messageText ?? <>&nbsp;</>}
                </span>
                <Input
                    className={cn(
                        'text-2xl text-center font-mono tracking-[0.25em] p-2',
                        messageText && (isMessageError
                            ? 'border-acctext-destructive text-destructive'
                            : 'border-succtext-success text-success'
                        ),
                    )}
                    id="frm-pin"
                    type="text"
                    ref={pinRef}
                    minLength={4}
                    maxLength={4}
                    placeholder="0000"
                    autoComplete="off"
                    onFocus={(e) => {
                        setIsMessageError(false);
                        setMessageText(undefined);
                        e.target?.select();
                    }}
                    onChange={(e) => {
                        if (e.target.value.length === 4) {
                            submitPin();
                        }
                    }}
                    disabled={disableInput}
                    required
                />
            </CardContent>
            <CardFooter>
                <Button className="w-full" disabled={disableInput}>
                    {disableInput && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Link Account
                </Button>
            </CardFooter>
        </form>
    );
}
