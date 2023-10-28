import { Link, Route, Switch } from "wouter";
import Login from "./pages/auth/Login";
import CfxreCallback from "./pages/auth/CfxreCallback";
import AddMasterPin from "./pages/auth/AddMasterPin";
import AddMasterCallback from "./pages/auth/AddMasterCallback";
import { Card } from "./components/ui/card";


export default function AuthShell() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Link
                    href="/"
                    className="bg-pink-600 hover:bg-pink-500 text-3xl
                    p-1 font-bold tracking-widest rounded"
                >
                    txAdmin
                </Link>

                <Card className="mt-8 mb-4 w-96 min-h-[24rem]">
                    <Switch>
                        <Route path="/login"><Login /></Route>
                        <Route path="/login/cfxre/callback"><CfxreCallback /></Route>
                        <Route path="/addMaster/pin"><AddMasterPin /></Route>
                        <Route path="/addMaster/callback"><AddMasterCallback /></Route>
                        <Route path="/:fullPath*">
                            <small>redirecting to the login page...</small>
                        </Route>
                    </Switch>
                </Card>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="bg-pink-600 hover:bg-pink-500 text-xl p-1 font-bold tracking-widest rounded w-full"
                    >
                        ZAP
                    </Link>
                    <Link
                        href="/"
                        className="bg-pink-600 hover:bg-pink-500 text-xl p-1 font-bold tracking-widest rounded w-full"
                    >
                        Discord
                    </Link>
                </div>
            </div>
        </div>
    );
}
