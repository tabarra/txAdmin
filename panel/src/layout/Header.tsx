import { cn } from "@/lib/utils";
import { LuMenu, LuMonitor, LuPersonStanding } from "react-icons/lu";
import DesktopHeader from "./DesktopNavbar";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/hooks/auth";

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
    // const { setShowServer } = useAppData();
    const setShowServer = (x: any) => { }//FIXME:

    return (
        <button
            className={cn(navButtonClasses, className)}
            title="Server Menu"
            onClick={() => setShowServer((show: boolean) => !show)}
        >
            <i className="h-6 sm:h-4 flex items-center">
                <LuMonitor size="24" />
            </i>
            <div className="hidden sm:flex flex-row min-w-max">
                Server
            </div>
        </button>
    );
}

function ButtonToggleGlobalMenu({ className }: NavButtonProps) {
    return (
        <button className={cn(navButtonClasses, className)} title="Global Menu">
            <i className="h-6 sm:h-4 flex items-center">
                <LuMenu size="24" />
            </i>
            <div className="hidden sm:flex flex-row min-w-max">
                Menu
            </div>
        </button>
    );
}

function ButtonTogglePlayerlistSheet({ className }: NavButtonProps) {
    // const [playerCount] = usePlayerCount();
    const playerCount = 1234; //FIXME:

    return (
        <button className={cn(navButtonClasses, className)} title="Playerlist">
            <i className="h-6 sm:h-4 flex items-center">
                <LuPersonStanding size="24" />
            </i>
            <div className="hidden sm:flex flex-row min-w-max">
                Players
                <span className="hidden lg:inline-block font-mono">: {playerCount}</span>
            </div>
        </button>
    );
}

//Segmenting this into a component prevents full header rerenders
function AuthedHeaderFragment() {
    const { authData } = useAuth();
    if (!authData) return null;

    //FIXME: make this a dropdown
    return <>
        <a href="#" className="hidden xl:block text-muted-foreground">
            {authData.name}
        </a>
        <Avatar
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-md text-2xl 
                transition-all focus-visible:outline-none
                hover:border-zinc-500 hover:border"
            username={authData.name}
            profilePicture={authData.profilePicture}
        />
    </>
}

export function Header() {
    return (
        <header className="sticky top-0 z-10 flex flex-col items-center justify-center
            border-b bg-card text-card-foreground border-card-background">
            <div className="h-14 lg:px-3 px-2 w-full max-w-[1920px] flex flex-row justify-between transition-all">
                <div
                    id="navbarLeft"
                    className="flex flex-row items-center flex-grow gap-5 mr-5"
                >
                    <div className="w-sidebar hidden xl:flex justify-center">
                        <span className="h-7 w-36 bg-fuchsia-400 text-center">FULL LOGO</span>
                    </div>
                    <div className="h-8 w-8 lg:h-10 lg:w-10 hidden sm:max-xl:block bg-fuchsia-400 text-center">
                        TX
                    </div>
                    <div className="lg:hidden">
                        <ServerTitle />
                    </div>
                    <nav className="hidden lg:block flex-grow">
                        <DesktopHeader />
                    </nav>
                </div>

                <div id="navbarRight" className="flex flex-row items-center gap-2 sm:gap-3">
                    <ButtonToggleServerSheet className="lg:hidden" />
                    <ButtonToggleGlobalMenu className="lg:hidden" />
                    <ButtonTogglePlayerlistSheet className="xl:hidden" />
                    <AuthedHeaderFragment />
                </div>
            </div>
        </header>
    );
}
