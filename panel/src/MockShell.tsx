import { Link, useRoute } from "wouter";
import { cn } from "./lib/utils";
import ShellRouter from "./ShellRouter";
import { useContentRefresh, pageErrorStatusAtom } from "./hooks/mainPageStatus";
import { useAtomValue } from "jotai";


function MenuLink(props: React.HTMLProps<HTMLAnchorElement> & { href: string }) {
    const isPageInError = useAtomValue(pageErrorStatusAtom);
    const refreshContent = useContentRefresh();
    const [isActive] = useRoute(props.href);
    const checkOnClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (isActive || isPageInError) {
            console.log('Page is already active or in error state. Forcing error boundry + router re-render.');
            refreshContent();
        }
        props.onClick && props.onClick(e);
    }

    return (
        <Link {...props} onClick={checkOnClick}>
            <a className={cn(
                "hover:bg-zinc-800 hover:text-white py-1 px-2 rounded-sm",
                isActive && "bg-zinc-800 text-white"
            )}>{props.children}</a>
        </Link>
    );
}

function MockLink({ children }: { children: React.ReactNode }) {
    return (
        <div className="hover:bg-zinc-800 text-fuchsia-500 py-1 px-2 rounded-sm cursor-pointer">
            {children}
        </div>
    );
}

function Header() {
    return (
        <div className="border-b px-8 flex flex-row h-10 items-center">
            <Link href="/" className="bg-pink-600 hover:bg-pink-500 text-xl px-2 font-bold tracking-widest rounded">txAdmin</Link>
            <div className="flex gap-3 items-center ml-3">
                <MenuLink href="/players">Players</MenuLink>
                <MockLink>History</MockLink>
                <MenuLink href="/whitelist">Whitelist</MenuLink>
                <MenuLink href="/admins">Admins</MenuLink>
                <MenuLink href="/settings">Settings</MenuLink>
                <MenuLink href="/system/master-actions">[sys] Master Actions</MenuLink>
                <MenuLink href="/system/diagnostics">[sys] Diagnostics</MenuLink>
                <MenuLink href="/system/console-log">[sys] Console</MenuLink>
                <MenuLink href="/system/action-log">[sys] Action</MenuLink>
            </div>
        </div>
    );
}
function ServerSidebar() {
    return (
        <div className="border-r">
            <div className="flex gap-3 flex-col p-2">
                <span className="text-muted-foreground">Server Menu:</span>
                <MenuLink href="/">Dashboard</MenuLink>
                <MenuLink href="/server/console">Live Console</MenuLink>
                <MenuLink href="/server/resources">Resources</MenuLink>
                <MenuLink href="/server/server-log">Server Log</MenuLink>
                <MenuLink href="/server/cfg-editor">CFG Editor</MenuLink>
                {window.txConsts.showAdvanced && (
                    <MenuLink href="/advanced">Advanced</MenuLink>
                )}
                <br />
                <span className="text-muted-foreground">Temp Menu:</span>
                <MenuLink href="/404">404</MenuLink>
                <MenuLink href="/test">Test</MenuLink>
            </div>
        </div>
    );
}

export default function MockShell() {
    return (
        <div className="h-full min-h-screen">
            <Header />
            <div className="w-full max-w-[1920px] h-[calc(100vh-2.5rem-0.75rem)] flex grow mt-3">
                <ServerSidebar />
                <main className="flex flex-1 ml-3">
                    <ShellRouter />
                </main>
            </div>
        </div>
    );
}
