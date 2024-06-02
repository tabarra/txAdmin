import { Link, Route, Switch } from "wouter";
import Login from "../pages/auth/Login";
import CfxreCallback from "../pages/auth/CfxreCallback";
import AddMasterPin from "../pages/auth/AddMasterPin";
import AddMasterCallback from "../pages/auth/AddMasterCallback";
import { Card } from "../components/ui/card";
import { LogoFullSquareGreen } from "@/components/Logos";
import { useTheme } from "@/hooks/theme";
import { handleExternalLinkClick } from "@/lib/utils";


export default function AuthShell() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center m-4 w-full xs:w-[25rem] min-w-[20rem]">
                <LogoFullSquareGreen className="h-12 mx-auto" />

                <Card className="min-h-64 mt-8 mb-4 p-4 flex items-center justify-center">
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

                <div className="mx-auto flex flex-wrap gap-4 justify-center mb-2">
                    {window.txConsts.adsData.login ? (
                        <a
                            href={window.txConsts.adsData.login.url}
                            onClick={handleExternalLinkClick}
                            target='_blank'
                            className='w-48 h-16 relative group shadow-sm opacity-90 hover:opacity-100
                            dark:brightness-90 dark:hover:brightness-110'
                        >
                            <div className='absolute inset-0 -z-10 animate-pulse blur 
                            scale-0 group-hover:scale-100 transition-transform bg-black
                            dark:bg-gradient-to-r dark:from-[#18E889] dark:to-[#01FFFF]' />
                            <img
                                className='rounded-lg max-w-48 max-h-16 m-auto'
                                src={window.txConsts.adsData.login.img}
                            />
                        </a>
                    ) : null}
                    <a
                        href='https://discord.gg/uAmsGa2'
                        onClick={handleExternalLinkClick}
                        target='_blank'
                        className='w-48 h-16 relative group shadow-sm opacity-90 hover:opacity-100 brightness-110
                        dark:brightness-95 dark:hover:brightness-110'
                    >
                        <div className='absolute inset-0 -z-10 animate-pulse blur 
                        scale-0 group-hover:scale-100 transition-transform bg-black
                        dark:bg-gradient-to-t dark:from-[#8567EC] dark:to-[#BD5CBF]' />
                        <img
                            className='rounded-lg max-w-48 max-h-16 m-auto'
                            src="img/discord.png"
                        />
                    </a>
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
