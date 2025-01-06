import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import React, { useState, useCallback } from "react"
import { PlusIcon, TrashIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TimeInputDialog } from "@/components/TimeInputDialog"
import TxAnchor from "@/components/TxAnchor"
import { useAutoAnimate } from "@formkit/auto-animate/react"


// Remove duplicates and sort times
function sanitizeTimes(times: string[]): string[] {
    const uniqueTimes = Array.from(new Set(times));
    return uniqueTimes.sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return aHours - bHours || aMinutes - bMinutes;
    });
}

function RestartScheduleBox() {
    const [isTimeInputOpen, setIsTimeInputOpen] = useState(false);
    const [times, setTimes] = useState<string[]>([]);
    const [animationParent] = useAutoAnimate();

    const addTime = (time: string) => {
        setTimes(prev => sanitizeTimes([...prev, time]));
    };
    const removeTime = (index: number) => {
        setTimes(prev => sanitizeTimes(prev.filter((_, i) => i !== index)));
    };
    const applyPreset = (presetTimes: string[]) => {
        setTimes(presetTimes);
    };
    const clearTimes = () => {
        setTimes([]);
    };

    return (
        <div className="py-3 px-2 min-h-[4.5rem] flex items-center border rounded-lg">
            <div className="w-full flex items-center gap-2">
                <div className="flex flex-wrap gap-2 grow" ref={animationParent}>
                    {times.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                            <span>
                                No schedule set. Click on the <strong>+</strong> button to add a time.
                            </span>
                            <p>
                                {'Presets: '}
                                <a
                                    onClick={() => applyPreset(['00:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    1x<span className="text-muted-foreground">/day</span>
                                </a>
                                {', '}
                                <a
                                    onClick={() => applyPreset(['00:00', '12:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    2x<span className="text-muted-foreground">/day</span>
                                </a>
                                {', '}
                                <a
                                    onClick={() => applyPreset(['00:00', '08:00', '16:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    3x<span className="text-muted-foreground">/day</span>
                                </a>
                                {', '}
                                <a
                                    onClick={() => applyPreset(['00:00', '06:00', '12:00', '18:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    4x<span className="text-muted-foreground">/day</span>
                                </a>
                            </p>
                        </div>
                    )}
                    {times.map((time, index) => (
                        <div key={time} className="flex items-center space-x-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md select-none">
                            <span className="font-mono">{time}</span>
                            <button
                                onClick={() => removeTime(index)}
                                className="ml-2 text-secondary-foreground/50 hover:text-destructive"
                                aria-label="Remove"
                            >
                                <XIcon className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsTimeInputOpen(true)}
                        variant="secondary"
                        size={'xs'}
                        className="w-10 hover:bg-primary hover:text-primary-foreground"
                        aria-label="Add"
                    >
                        <PlusIcon className="h-4" />
                    </Button>
                    <Button
                        onClick={() => clearTimes()}
                        variant="muted"
                        size={'xs'}
                        className="w-10 hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Clear"
                        disabled={times.length === 0}
                    >
                        <TrashIcon className="h-3.5" />
                    </Button>
                </div>
            </div>
            <TimeInputDialog
                title="Add Restart Time"
                isOpen={isTimeInputOpen}
                onClose={() => setIsTimeInputOpen(false)}
                onSubmit={addTime}
            />
        </div>
    )
}


export function MainGroup() {
    // Check if the browser timezone is different from the server timezone
    let timezoneAlertNode: React.ReactNode = null;
    try {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (window.txConsts.serverTimezone !== browserTimezone) {
            timezoneAlertNode = (
                <SettingItemDesc className="text-destructive-inline">
                    <strong>Warning:</strong> Your server timezone is set to <InlineCode>{window.txConsts.serverTimezone}</InlineCode>, but your browser timezone is <InlineCode>{browserTimezone}</InlineCode>. Make sure to configure the time according to the server timezone.
                </SettingItemDesc>
            );
        }
    } catch (error) {
        console.error(error);
    }

    // TODO: get this from the server's env vars
    let serverDataPlaceholder;
    if (window.txConsts.isWindows) {
        serverDataPlaceholder = 'C:/Users/Admin/Desktop/serverdata';
    } else if (window.txConsts.isZapHosting) {
        serverDataPlaceholder = '/home/zap9999999/g999999/gta5-fivem-txadmin/serverdata';
    } else if (window.txConsts.isPterodactyl) {
        serverDataPlaceholder = '/home/container/serverdata/';
    } else {
        serverDataPlaceholder = '/root/fivem/txData/serverdata';
    }

    return (<>
    
        <SettingItem label="Server Data Folder" htmlFor="serverDataPath" required>
            <Input id="serverDataPath" placeholder={serverDataPlaceholder} required />
            <SettingItemDesc>
                The full path of the folder that <strong>contains</strong> the <InlineCode>resources</InlineCode> folder, usually it's the same place that contains your <InlineCode>server.cfg</InlineCode>.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Restart Schedule" showOptional>
            <RestartScheduleBox />
            {timezoneAlertNode}
            <SettingItemDesc>
                At which times of day to restart the server. <br />
                <strong>Note:</strong> Make sure your schedule matches your server time and not your local time.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Quiet Mode">
            <SwitchText
                id="quietMode"
                checkedLabel="Enabled"
                uncheckedLabel="Disabled"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Do not print FXServer's output to the terminal. <br />
                You will still be able to use the Live Console.
            </SettingItemDesc>
        </SettingItem>
    </>)
}

export function AdvancedGroup() {
    return (<>
        <SettingItem label="CFG File Path" required>
            <Input id="cfgPath" placeholder="server.cfg" required />
            <SettingItemDesc>
                The path to your server config file, probably named <InlineCode>server.cfg</InlineCode>. <br />
                This can either be absolute, or relative to the Server Data folder.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Launch Arguments" htmlFor="launchArguments">
            <Input
                id="launchArguments"
                placeholder="--trace-warning"
            />
            <SettingItemDesc>
                Additional command-line arguments to pass to the FXServer instance such as NodeJS CLI flags. <br />
                <strong>Warning:</strong> You almost certainly should not use this option, commands and convars should be placed in your <InlineCode>server.cfg</InlineCode> instead.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="OneSync" htmlFor="oneSync">
            <Select>
                <SelectTrigger id="oneSync">
                    <SelectValue placeholder="Select OneSync option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="on">On (recommended)</SelectItem>
                    <SelectItem value="legacy">Legacy</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                </SelectContent>
            </Select>
            <SettingItemDesc>
                Most servers should be using <strong>OneSync On</strong>. <br />
                The other options are considered deprecated and should not be used unless you know what you're doing.
                For more information, please read the <TxAnchor href="https://docs.fivem.net/docs/scripting-reference/onesync/" >documentation</TxAnchor>.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Autostart">
            <SwitchText
                id="autostart"
                checkedLabel="Enabled"
                uncheckedLabel="Disabled"
                defaultChecked={true}
            />
            <SettingItemDesc>
                Start the server automatically after <strong>txAdmin</strong> starts.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Resource Starting Tolerance">
            <Select defaultValue='90'>
                <SelectTrigger id="resourceStartingTolerance">
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="90">1.5 minutes (default)</SelectItem>
                    <SelectItem value="180">3 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                </SelectContent>
            </Select>
            <SettingItemDesc>
                At server boot, how much time to wait for any single resource to start before restarting the server. <br />
                <strong>Note:</strong> If you are getting <InlineCode>failed to start in time</InlineCode> errors, increase this value.
            </SettingItemDesc>
        </SettingItem>
    </>)
}
