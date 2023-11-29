import { Link, Route, Switch } from "wouter";
import Login from "../pages/auth/Login";
import CfxreCallback from "../pages/auth/CfxreCallback";
import AddMasterPin from "../pages/auth/AddMasterPin";
import AddMasterCallback from "../pages/auth/AddMasterCallback";
import { Card } from "../components/ui/card";


export default function AuthShell() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center m-4 w-full xs:w-96 min-w-[300px]">
                <Link
                    href="/login"
                    className="bg-accent hover:bg-accent/75 text-3xl
                    p-1 font-bold tracking-widest rounded"
                >
                    txAdmin
                </Link>

                <Card className="min-h-[16rem] mt-8 mb-4 p-4 flex items-center justify-center">
                    <Switch>
                        <Route path="/login"><Login /></Route>
                        <Route path="/login/callback"><CfxreCallback /></Route>
                        <Route path="/addMaster/pin"><AddMasterPin /></Route>
                        <Route path="/addMaster/callback"><AddMasterCallback /></Route>
                        <Route path="/:fullPath*">
                            <small>redirecting to the login page...</small>
                        </Route>
                    </Switch>
                </Card>

                <div className="flex gap-4 justify-center mb-2">
                    <Link
                        href="/"
                        className="bg-accent hover:bg-accent/75 text-xl p-1 font-bold tracking-widest rounded w-full"
                    >
                        ZAP
                    </Link>
                    <Link
                        href="/"
                        className="bg-accent hover:bg-accent/75 text-xl p-1 font-bold tracking-widest rounded w-full"
                    >
                        Discord
                    </Link>
                </div>

                <div>
                    <small className="text-muted-foreground text-sm font-light">
                        tx: <strong>v{window.txConsts.txaVersion}</strong>
                        &nbsp;|
                        fx: <strong>b{window.txConsts.fxsVersion}</strong>
                    </small>
                </div>
            </div>
        </div>
    );
}
