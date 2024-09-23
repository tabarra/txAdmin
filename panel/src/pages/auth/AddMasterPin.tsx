import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ApiAddMasterPinReq, ApiAddMasterPinResp } from "@shared/authApiTypes";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { LogoutReasonHash } from "./Login";

export default function AddMasterPin() {
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [messageText, setMessageText] = useState<string | undefined>();
    const [isMessageError, setIsMessageError] = useState<boolean>(false);
    const pinRef = useRef<HTMLInputElement>(null);

    const submitMutation = useMutation<
        ApiAddMasterPinResp,
        Error,
        ApiAddMasterPinReq
    >({
        mutationFn: ({ pin, origin }) => fetch('/auth/addMaster/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, origin })
        }).then(res => res.json()),
        onSuccess: (data) => {
            if ('error' in data) {
                if (data.error === 'master_already_set') {
                    setIsRedirecting(true);
                    window.location.href = `/login${LogoutReasonHash.MASTER_ALREADY_SET}`;
                } else {
                    setIsMessageError(true);
                    setMessageText(data.error);
                }
            } else {
                setIsRedirecting(true);
                console.log('Redirecting to', data.authUrl);
                window.location.href = data.authUrl;
            }
        },
        onError: (error: Error) => {
            setIsMessageError(true);
            if (error.message.startsWith('NetworkError')) {
                setMessageText('Network error. If you closed txAdmin, please restart it and try again.');
            } else {
                setMessageText(error.message);
            }
        },
    });

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        setIsMessageError(false);
        setMessageText(undefined);

        submitMutation.mutate({
            pin: pinRef.current?.value || '0000',
            origin: window.location.origin,
        });
    };

    useEffect(() => {
        if (/^#\d{4}$/.test(window.location.hash)) {
            setMessageText('Autofilled ✔');
            pinRef.current!.value = window.location.hash.substring(1);
        }
    }, []);

    const disableInput = submitMutation.isPending || isRedirecting;

    return (
        <form onSubmit={handleSubmit} className='w-full'>
            <CardHeader className="space-y-1">
                <CardTitle className="text-3xl">No Cfx.re account linked.</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Type the PIN from your terminal and click "Link Account".
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
                    id="frm-pin" type="text" ref={pinRef}
                    minLength={4} maxLength={4} placeholder="0000" autoComplete="off"
                    onFocus={() => { setIsMessageError(false); setMessageText(undefined); }}
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
