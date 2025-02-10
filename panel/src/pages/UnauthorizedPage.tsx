import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon } from "lucide-react";
import { Link } from "wouter";


function PermissionTooltip({ permission }: { permission: string }) {
    return (
        <Tooltip>
            <TooltipTrigger className="underline decoration-dotted cursor-help tracking-wider">
                permission
            </TooltipTrigger>
            <TooltipContent>
                {permission}
            </TooltipContent>
        </Tooltip>
    )
}


type UnauthorizedPageProps = {
    pageName: string;
    permission: string;
};

export default function UnauthorizedPage({ pageName, permission }: UnauthorizedPageProps) {
    let messageNode;
    if (permission === 'master') {
        messageNode = (<>
            You need to be the Master account to view the <strong className="text-accent">{pageName}</strong> page.
        </>);
    } else {
        messageNode = (<>
            You don't have the required <PermissionTooltip permission={permission} /> to view the <strong className="text-accent">{pageName}</strong> page. <br />
            Please contact your server owner if you believe this is an
            error.
        </>);
    }
    return (
        <div className="w-full px-4 pt-[7.5vh] flex items-start justify-center bg-background">
            <div className="mx-auto max-w-xl text-center border border-destructive/50 rounded-lg p-6 bg-destructive-hint/15 space-y-4">
                <h1 className="text-2xl font-bold tracking-tight text-destructive">
                    <ShieldAlertIcon className="size-6 mr-2 mt-0.5 inline align-text-top" />
                    Access Denied
                </h1>
                <p className="mt-4 text-sm text-primary/90 tracking-wide">
                    {messageNode}
                </p>
                <Button variant="outline" size='sm' asChild>
                    <Link href="/">Return to Dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
