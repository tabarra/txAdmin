import InlineCode from "@/components/InlineCode";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { ApiOauthCallbackErrorResp } from "@shared/authApiTypes";
import { Link } from "wouter";

const ErrorTitle = ({ children }: { children: React.ReactNode }) => {
    return (
        <h1 className="text-2xl font-bold text-red-500 mb-4">
            {children}
        </h1>
    );
};
const ErrorText = ({ children }: { children: React.ReactNode }) => {
    return (
        <p className="whitespace-pre-wrap pb-2">
            {children}
        </p>
    );
};
const ErrorFooter = ({returnTo}: { returnTo: string }) => {
    return (
        <CardFooter className="w-full flex justify-center mt-4 pb-0">
            <Link href={returnTo}>
                <Button className="x">
                    Try Again
                </Button>
            </Link>

        </CardFooter>
    );
};


type Props = {
    error: ApiOauthCallbackErrorResp;
    returnTo?: string;
};
export default function OauthErrors({ error, returnTo }: Props) {
    returnTo = returnTo ?? '/login';
    if ('errorTitle' in error) {
        return (
            <div>
                <ErrorTitle>{error.errorTitle}</ErrorTitle>
                <ErrorText>{error.errorMessage}</ErrorText>
                <ErrorFooter returnTo={returnTo} />
            </div>
        );
    } else if (error.errorCode === 'invalid_session') {
        return (
            <div>
                <ErrorTitle>Invalid Browser Session.</ErrorTitle>
                <ErrorText>
                    You may have restarted txAdmin right before entering this page. <br />
                    Please return and try again.
                </ErrorText>
                <ErrorFooter returnTo={returnTo} />
            </div>
        );
    } else if (error.errorCode === 'clock_desync') {
        return (
            <div>
                <ErrorTitle>Please Update/Synchronize your VPS clock.</ErrorTitle>
                <ErrorText>
                    Failed to login because this host's time is wrong. Please make sure to synchronize it with the internet.
                </ErrorText>
                <ErrorFooter returnTo={returnTo} />
            </div>
        );
    } else if (error.errorCode === 'timeout') {
        return (
            <div>
                <ErrorTitle>Connection to FiveM servers timed out.</ErrorTitle>
                <ErrorText>
                    Please try again or login using your existing username and backup password.
                </ErrorText>
                <ErrorFooter returnTo={returnTo} />
            </div>
        );
    } else if (error.errorCode === 'not_admin') {
        const fivemId = error.errorContext?.identifier ?? 'unknown';
        const fivemName = error.errorContext?.name ?? 'unknown';
        return (
            <div>
                <ErrorTitle>{`The Cfx.re account '${fivemName}' is not an admin.`}</ErrorTitle>
                <ErrorText>
                    The account above with identifier <InlineCode>{fivemId}</InlineCode> is not assigned to any account registered on txAdmin. <br />
                    You can also try to login using your username and backup password.
                </ErrorText>
                <ErrorFooter returnTo={returnTo} />
            </div>
        );
    } else {
        return (
            <>
                <ErrorTitle>Unknown Error:</ErrorTitle>
                <div className="text-left rounded-sm text-muted-foreground bg-muted p-1">
                    <code className="text-left whitespace-pre-wrap ">{JSON.stringify(error, null, 2)}</code>
                </div>
                <ErrorFooter returnTo={returnTo} />
            </>
        );
    }
}
