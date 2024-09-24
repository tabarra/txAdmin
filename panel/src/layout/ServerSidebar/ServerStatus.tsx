import { useGlobalStatus } from '@/hooks/status';
import { VariantProps, cva } from 'class-variance-authority';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


const statusBadgeVariants = cva(
    `rounded-sm text-xs font-semibold px-1 py-[0.125rem] tracking-widest text-center cursor-help`,
    {
        variants: {
            type: {
                default: "bg-secondary text-secondary-foreground",
                destructive: "bg-destructive text-destructive-foreground",
                warning: "bg-warning text-warning-foreground",
                success: "bg-success text-success-foreground",
                info: "bg-info text-info-foreground",
                muted: "bg-muted text-muted-foreground",
            },
        },
        defaultVariants: {
            type: "default",
        },
    }
);
type StatusBadgeTypesVars = VariantProps<typeof statusBadgeVariants>['type'];
type StatusBadgeProps = {
    tooltip: string;
    type?: StatusBadgeTypesVars;
    children: React.ReactNode;
};

function StatusBadge({ children, tooltip, type }: StatusBadgeProps) {
    return <Tooltip>
        <TooltipTrigger asChild>
            <span className={statusBadgeVariants({ type })}>
                {children}
            </span>
        </TooltipTrigger>
        <TooltipContent side='right'>
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
}

//Ref: https://discord.js.org/#/docs/discord.js/main/typedef/Status
const discordStatusMap = [
    'READY',
    'CONNECTING',
    'RECONNECTING',
    'IDLE',
    'NEARLY',
    'DISCONNECTED',
    'WAITING_FOR_GUILDS',
    'IDENTIFYING',
    'RESUMING',
] as const;

export default function ServerStatus() {
    const globalStatus = useGlobalStatus();

    //Preparing status
    let serverStatusText = '--';
    let serverStatusDescription = '--';
    let serverStatusColor: StatusBadgeTypesVars = 'default';
    let whitelistText = '--';
    let whitelistDescription = '--';
    let whitelistColor: StatusBadgeTypesVars = 'default';
    let discordStatusText = '--';
    let discordStatusDescription = '--';
    let discordStatusColor: StatusBadgeTypesVars = 'default';
    let cpxRacesStatusText = '--';
    let cpxRacesStatusDescription = '--';
    let cpxRacesStatusColor: StatusBadgeTypesVars = 'default';

    if (globalStatus) {
        //Server status
        serverStatusText = globalStatus.server.status;
        if (globalStatus.server.status === 'ONLINE') {
            serverStatusColor = 'success';
            serverStatusDescription = 'Resources running, accepting connections.';
        } else if (globalStatus.server.status === 'PARTIAL') {
            serverStatusColor = 'warning';
            serverStatusDescription = 'Resources not running or not accepting connections.';
        } else if (globalStatus.server.status === 'OFFLINE') {
            serverStatusColor = 'destructive';
            serverStatusDescription = 'Server is offline.';
        } else {
            serverStatusColor = 'destructive';
            serverStatusDescription = 'Unknown server status.';
        }

        //Whitelist
        if (globalStatus.server.whitelist === 'disabled') {
            whitelistText = 'DISABLED';
            whitelistDescription = 'Anyone can join.';
        } else if (globalStatus.server.whitelist === 'adminOnly') {
            whitelistText = 'ADMIN';
            whitelistColor = 'warning';
            whitelistDescription = 'Only admins can join.';
        } else if (globalStatus.server.whitelist === 'guildMember') {
            whitelistText = 'MEMBER';
            whitelistDescription = 'Only guild members can join.';
        } else if (globalStatus.server.whitelist === 'guildRoles') {
            whitelistText = 'ROLE';
            whitelistDescription = 'Only guild members with the specified roles can join.';
        } else if (globalStatus.server.whitelist === 'approvedLicense') {
            whitelistText = 'LICENSE';
            whitelistDescription = 'Only players with an approved license can join.';
        }

        //Bot status - too long to show all the text, so just show the code
        if (globalStatus.discord === false) {
            discordStatusText = 'DISABLED';
            discordStatusColor = 'default';
            discordStatusDescription = 'Discord bot is disabled.';
        } else if (globalStatus.discord === 0) {
            discordStatusText = 'READY';
            discordStatusColor = 'default';
            discordStatusDescription = 'Discord bot is ready.';
        } else {
            discordStatusText = `CODE-${globalStatus.discord}`;
            discordStatusColor = 'destructive';
            discordStatusDescription = discordStatusMap[globalStatus.discord]
                ? `Bot ws status: ${discordStatusMap[globalStatus.discord]}`
                : 'Unknown status code';
        }

        if (globalStatus.server.cpxRaces === 'online') {
            cpxRacesStatusText = 'ONLINE';
            cpxRacesStatusDescription = 'Websocket server is online.';
            cpxRacesStatusColor = 'success';
        } else {
            cpxRacesStatusText = 'OFFLINE';
            cpxRacesStatusDescription = 'Websocket server is offline.';
            cpxRacesStatusColor = 'destructive';
        }
    }

    return (
        <div className="flex flex-col gap-[0.375rem]">
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                Server:
                <StatusBadge
                    tooltip={serverStatusDescription}
                    type={serverStatusColor}
                >{serverStatusText}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                Process:
                <StatusBadge
                    tooltip='Status of the FXServer process.'
                >{globalStatus?.server.process.toUpperCase() ?? '--'}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                Whitelist:
                <StatusBadge
                    tooltip={whitelistDescription}
                    type={whitelistColor}
                >{whitelistText}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                Discord Bot:
                <StatusBadge
                    tooltip={discordStatusDescription}
                    type={discordStatusColor}
                >{discordStatusText}</StatusBadge>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-sm gap-1.5">
                CPX Races:
                <StatusBadge
                    tooltip={cpxRacesStatusDescription}
                    type={cpxRacesStatusColor}
                >{cpxRacesStatusText}</StatusBadge>
            </div>
        </div>
    )
}
