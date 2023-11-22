import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { KeyRoundIcon, LogOutIcon, Menu, Monitor, MoonIcon, PersonStanding, SunIcon } from "lucide-react";
import DesktopHeader from "./DesktopNavbar";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/hooks/auth";
import { useGlobalMenuSheet, usePlayerlistSheet, useServerSheet } from "@/hooks/sheets";
import { useTheme } from "@/hooks/useTheme";
import { FaDiscord } from "react-icons/fa";


function ServerTitle() {
    // FIXME: make data dynamic
    const playerCount = 1234;
    const serverName = '{{serverName}}';

    return (
        <div className="flex justify-start">
            <h1 className="line-clamp-1 text-base break-all">
                {serverName}
            </h1>
            <span>
                :&nbsp;
                <span className="font-mono" title="players connected">{playerCount}</span>
            </span>
        </div>
    );
}


type NavButtonProps = {
    className?: string;
};
const navButtonClasses = `h-11 w-11 sm:h-10 sm:min-w-max sm:px-2 lg:px-3
    flex justify-center items-center gap-2
    transition-all ring-offset-background 
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    rounded-md text-sm border
   
    bg-zinc-100 hover:bg-zinc-200 border-zinc-200
    dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800
`;

function ButtonToggleServerSheet({ className }: NavButtonProps) {
    const { setIsSheetOpen } = useServerSheet();
    return (
        <button
            className={cn(navButtonClasses, className)}
            title="Server Menu"
            onClick={() => setIsSheetOpen(true)}
        >
            <Monitor className="h-6 w-6 sm:h-5 sm:w-5" />
            <div className="hidden sm:flex flex-row min-w-max align-middle">
                Server
            </div>
        </button>
    );
}

function ButtonToggleGlobalMenu({ className }: NavButtonProps) {
    const { setIsSheetOpen } = useGlobalMenuSheet();
    return (
        <button
            className={cn(navButtonClasses, className)}
            title="Global Menu"
            onClick={() => setIsSheetOpen(true)}
        >
            <Menu className="h-6 w-6 sm:h-5 sm:w-5" />
            <div className="hidden sm:flex flex-row min-w-max">
                Menu
            </div>
        </button>
    );
}

function ButtonTogglePlayerlistSheet({ className }: NavButtonProps) {
    const { setIsSheetOpen } = usePlayerlistSheet();
    // const [playerCount] = usePlayerCount();
    const playerCount = 1234; //FIXME:

    return (
        <button
            className={cn(navButtonClasses, className)}
            title="Global Menu"
            onClick={() => setIsSheetOpen(true)}
        >
            <PersonStanding className="h-6 w-6 sm:h-5 sm:w-5" />
            <div className="hidden sm:flex flex-row min-w-max">
                Players
                <span className="hidden lg:inline-block font-mono">: {playerCount}</span>
            </div>
        </button>
    );
}

//Segmenting this into a component prevents full header rerenders
function AuthedHeaderFragment() {
    const { authData, logout } = useAuth();
    if (!authData) return null;
    const { theme, setTheme } = useTheme();
    const switchTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }
    const openChangePasswordModal = () => {
        alert('TODO: open change password modal');
    }
    const gotoSupportDiscord = () => {
        window.open('https://discord.gg/uAmsGa2', '_blank');
    }
    const doLogout = () => {
        logout.mutate();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-row items-center gap-2 sm:gap-3">
                <span className="hidden xl:block text-muted-foreground">{authData.name}</span>
                <Avatar
                    className="w-11 h-11 sm:w-10 sm:h-10 rounded-md text-2xl 
                        transition-all focus-visible:outline-none
                        hover:border-zinc-500 hover:border"
                    username={authData.name}
                    profilePicture={authData.profilePicture}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer" onClick={switchTheme}>
                    <span className="hidden dark:flex items-center">
                        <SunIcon className="mr-2 h-4 w-4" />
                        Light Mode
                    </span>
                    <span className="flex dark:hidden items-center">
                        <MoonIcon className="mr-2 h-4 w-4" />
                        Dark Mode
                    </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={openChangePasswordModal}>
                    <KeyRoundIcon className="mr-2 h-4 w-4" />
                    Change Password
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={gotoSupportDiscord}>
                    <FaDiscord size="14" className="mr-2" />
                    Support
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={doLogout}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header() {
    return (
        <header className="sticky top-0 z-10 flex flex-col items-center justify-center
            border-b bg-card text-card-foreground border-card-background">
            <div className="h-14 lg:px-3 px-2 w-full max-w-[1920px] flex flex-row justify-between transition-all">
                <div className="flex flex-row items-center flex-grow gap-5 mr-5">
                    <div className="w-sidebar hidden xl:flex justify-center">
                        <span className="h-7 w-36 bg-accent text-accent-foreground rounded text-center p-0.5 font-bold tracking-widest">FULL LOGO</span>
                    </div>
                    <div className="h-8 w-8 lg:h-10 lg:w-10 rounded hidden sm:max-xl:block bg-accent text-accent-foreground text-center">
                        TX
                    </div>
                    <div className="lg:hidden">
                        <ServerTitle />
                    </div>
                    <nav className="hidden lg:block flex-grow">
                        <DesktopHeader />
                    </nav>
                </div>

                <div className="flex flex-row items-center gap-2 sm:gap-3">
                    <ButtonToggleServerSheet className="lg:hidden" />
                    <ButtonToggleGlobalMenu className="lg:hidden" />
                    <ButtonTogglePlayerlistSheet className="xl:hidden" />
                    <AuthedHeaderFragment />
                </div>
            </div>
        </header>
    );
}
