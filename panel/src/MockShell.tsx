import { Link, MakeLinkOptions, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

function MenuLink(props: MakeLinkOptions) {
    return (
        <Link to={props.to} className="hover:bg-zinc-800 hover:text-white py-1 px-2 rounded-sm cursor-pointer">
            {props.children}
        </Link>
    );
}
function MockLink({children}: {children: React.ReactNode}) {
    return (
        <div className="hover:bg-zinc-800 text-fuchsia-500 py-1 px-2 rounded-sm cursor-pointer">
            {children}
        </div>
    );
}

function Header() {
    return (
        <div className="border-b px-8 flex flex-row h-10 items-center">
            <Link className="bg-pink-600 hover:bg-pink-500 text-xl px-2 font-bold tracking-widest rounded" to="/">txAdmin</Link>
            <div className="flex gap-3 items-center ml-3">
                <MenuLink to="/">Dashboard</MenuLink>
                <MenuLink to="/players">Players</MenuLink>
                <MenuLink to="/whitelist">Whitelist</MenuLink>
                <MenuLink to="/admins">Admins</MenuLink>
                <MenuLink to="/settings">Settings</MenuLink>
                <MenuLink to="/system/diagnostics">[sys] Diagnostics</MenuLink>
                <MenuLink to="/system/console-log">[sys] Console</MenuLink>
                <MenuLink to="/system/action-log">[sys] Action</MenuLink>
            </div>
        </div>
    );
}
function ServerSidebar() {
    return (
        <div className="border-r">
            <div className="flex gap-3 flex-col p-2">
                <MenuLink to="/server/console">Live Console</MenuLink>
                <MockLink>Insights</MockLink>
                <MenuLink to="/resources">Resources</MenuLink>
                <MockLink>History</MockLink>
                <MenuLink to="/server/server-log">Server Log</MenuLink>
                <MenuLink to="/server/cfg-editor">CFG Editor</MenuLink>
                <MenuLink to="/server/config">Config</MenuLink>
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
                    <Outlet />
                </main>
            </div>
            <TanStackRouterDevtools />
        </div>
    );
}
