import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems'
import React, { useState, useEffect, useMemo, useRef } from "react"
import { PlusIcon, TrashIcon, Undo2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TimeInputDialog } from "@/components/TimeInputDialog"
import TxAnchor from "@/components/TxAnchor"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { processConfigStates, SettingsCardProps, useConfAccessor } from "../utils"
import SettingsCardShell from "../SettingsCardShell"
import { cn } from "@/lib/utils"
import { txToast } from "@/components/TxToaster"
import { useBackendApi } from "@/hooks/fetch"
import { useAdminPerms } from "@/hooks/auth"
import { useLocation } from "wouter"
import type { ResetServerDataPathResp } from "@shared/otherTypes"
import { useOpenConfirmDialog } from "@/hooks/dialogs"


// Remove duplicates and sort times
function sanitizeTimes(times: string[]): string[] {
    const uniqueTimes = Array.from(new Set(times));
    return uniqueTimes.sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return aHours - bHours || aMinutes - bMinutes;
    });
}


type RestartScheduleBoxProps = {
    restartTimes: string[] | undefined;
    setRestartTimes: React.Dispatch<React.SetStateAction<string[] | undefined>>
    disabled?: boolean;
};

function RestartScheduleBox({ restartTimes, setRestartTimes, disabled }: RestartScheduleBoxProps) {
    const [isTimeInputOpen, setIsTimeInputOpen] = useState(false);
    const [animationParent] = useAutoAnimate();

    const addTime = (time: string) => {
        if (!restartTimes || disabled) return;
        setRestartTimes(prev => sanitizeTimes([...prev ?? [], time]));
    };
    const removeTime = (index: number) => {
        if (!restartTimes || disabled) return;
        setRestartTimes(prev => sanitizeTimes((prev ?? []).filter((_, i) => i !== index)));
    };
    const applyPreset = (presetTimes: string[]) => {
        if (!restartTimes || disabled) return;
        setRestartTimes(presetTimes);
    };
    const clearTimes = () => {
        if (disabled) return;
        setRestartTimes([]);
    };

    const presetSpanClasses = cn(
        'text-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
    )

    return (
        <div className="py-3 px-2 min-h-[4.5rem] flex items-center border rounded-lg">
            <div className={cn("w-full flex items-center gap-2", disabled && 'cursor-not-allowed')}>
                <div className="flex flex-wrap gap-2 grow" ref={animationParent} >
                    {restartTimes && restartTimes.length === 0 && (
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
                                    1x<span className={presetSpanClasses}>/day</span>
                                </a>
                                {', '}
                                <a
                                    onClick={() => applyPreset(['00:00', '12:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    2x<span className={presetSpanClasses}>/day</span>
                                </a>
                                {', '}
                                <a
                                    onClick={() => applyPreset(['00:00', '08:00', '16:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    3x<span className={presetSpanClasses}>/day</span>
                                </a>
                                {', '}
                                <a
                                    onClick={() => applyPreset(['00:00', '06:00', '12:00', '18:00'])}
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    4x<span className={presetSpanClasses}>/day</span>
                                </a>
                            </p>
                        </div>
                    )}
                    {restartTimes && restartTimes.map((time, index) => (
                        <div key={time} className="flex items-center space-x-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md select-none">
                            <span className="font-mono">{time}</span>
                            {!disabled && <button
                                onClick={() => removeTime(index)}
                                className="ml-2 text-secondary-foreground/50 hover:text-destructive"
                                aria-label="Remove"
                                disabled={disabled}
                            >
                                <XIcon className="size-4" />
                            </button>}
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
                        disabled={disabled}
                    >
                        <PlusIcon className="h-4" />
                    </Button>
                    <Button
                        onClick={() => clearTimes()}
                        variant="muted"
                        size={'xs'}
                        className="w-10 hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Clear"
                        disabled={disabled || !restartTimes || restartTimes.length === 0}
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


const getServerDataPlaceholder = (hostSuggested?: string) => {
    if (hostSuggested) {
        const withoutTailSlash = hostSuggested.replace(/\/$/, '');
        return `${withoutTailSlash}/CFXDefault`;
    } else if (window.txConsts.isWindows) {
        return 'C:/Users/Admin/Desktop/CFXDefault';
    } else {
        return '/root/fivem/txData/CFXDefault';
    }
}

// Check if the browser timezone is different from the server timezone
function TimeZoneWarning() {
    try {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (window.txConsts.serverTimezone !== browserTimezone) {
            return (
                <SettingItemDesc className="text-destructive-inline">
                    <strong>Warning:</strong> Your server timezone is set to <InlineCode>{window.txConsts.serverTimezone}</InlineCode>, but your browser timezone is <InlineCode>{browserTimezone}</InlineCode>. Make sure to configure the time according to the server timezone.
                </SettingItemDesc>
            );
        }
    } catch (error) {
        console.error(error);
    }
    return null;
}


export default function ConfigCardFxserver({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isResettingServerData, setIsResettingServerData] = useState(false);
    const { hasPerm } = useAdminPerms();
    const setLocation = useLocation()[1];
    const openConfirmDialog = useOpenConfirmDialog();

    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const dataPath = conf('server', 'dataPath');
    const dataPathRef = useRef<HTMLInputElement | null>(null);
    const restarterSchedule = conf('restarter', 'schedule');
    const quietMode = conf('server', 'quiet');
    const cfgPath = conf('server', 'cfgPath');
    const cfgPathRef = useRef<HTMLInputElement | null>(null);
    const startupArgs = conf('server', 'startupArgs');
    const startupArgsRef = useRef<HTMLInputElement | null>(null);
    const onesync = conf('server', 'onesync');
    const autoStart = conf('server', 'autoStart');
    const resourceTolerance = conf('restarter', 'resourceStartingTolerance');

    const forceQuietMode = pageCtx.apiData?.forceQuietMode;

    //Marshalling Utils
    const selectNumberUtil = {
        toUi: (num?: number) => num ? num.toString() : undefined,
        toCfg: (str?: string) => str ? parseInt(str) : undefined,
    }
    const inputArrayUtil = {
        toUi: (args?: string[]) => args ? args.join(' ') : undefined,
        toCfg: (str?: string) => str ? str.trim().split(/\s+/) : undefined,
    }
    const emptyToNull = (str?: string) => {
        if (str === undefined) return undefined;
        const trimmed = str.trim();
        return trimmed.length ? trimmed : null;
    };

    //Check against stored value and sets the page state
    const processChanges = () => {
        if (!pageCtx.apiData) {
            return {
                changedConfigs: {},
                hasChanges: false,
                localConfigs: {},
            }
        }

        let currStartupArgs;
        if (startupArgsRef.current) {
            currStartupArgs = inputArrayUtil.toCfg(startupArgsRef.current.value);
        }
        let currDataPath;
        if (dataPathRef.current?.value) {
            currDataPath = dataPathRef.current.value.replace(/\\/g, '/').replace(/\/\/+/, '/');
            if (currDataPath.endsWith('/')) {
                currDataPath = currDataPath.slice(0, -1);
            }
        }
        const res = processConfigStates([
            [dataPath, emptyToNull(dataPathRef.current?.value)],
            [restarterSchedule, restarterSchedule.state.value],
            [quietMode, quietMode.state.value],
            [cfgPath, cfgPathRef.current?.value],
            [startupArgs, currStartupArgs],
            [onesync, onesync.state.value],
            [autoStart, autoStart.state.value],
            [resourceTolerance, resourceTolerance.state.value],
        ]);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
        if (!hasChanges) return;

        if (!localConfigs.server?.dataPath) {
            return txToast.error({
                title: 'The Server Data Folder is required.',
                md: true,
                msg: 'If you want to return to the Setup page, click on the "Reset" button instead.',
            });
        }
        if (localConfigs.server.cfgPath !== undefined && !localConfigs.server.cfgPath) {
            return txToast.error({
                title: 'The CFG File Path is required.',
                md: true,
                msg: 'The value should probably be `server.cfg`.',
            });
        }
        if (
            Array.isArray(localConfigs.server?.startupArgs)
            && localConfigs.server.startupArgs.some((arg) => arg.toLowerCase() === 'onesync')
        ) {
            return txToast.error({
                title: 'You cannot set OneSync in Startup Arguments.',
                md: true,
                msg: 'Please use the selectbox below it.',
            });
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        showAdvanced, //for referenced inputs
        restarterSchedule.state.value,
        quietMode.state.value,
        onesync.state.value,
        autoStart.state.value,
        resourceTolerance.state.value,
    ]);

    //Resets advanced settings when toggling the advanced switch
    useEffect(() => {
        if (showAdvanced) return;
        cfgPath.state.discard();
        startupArgs.state.discard();
        onesync.state.discard();
        autoStart.state.discard();
        resourceTolerance.state.discard();
    }, [showAdvanced]);

    //Card content stuff
    const serverDataPlaceholder = useMemo(
        () => getServerDataPlaceholder(pageCtx.apiData?.dataPath),
        [pageCtx.apiData]
    );

    //Reset server server data button
    const resetServerDataApi = useBackendApi<ResetServerDataPathResp>({
        method: 'POST',
        path: `/settings/resetServerDataPath`,
        throwGenericErrors: true,
    });
    const handleResetServerData = () => {
        openConfirmDialog({
            title: 'Reset Server Data Path',
            message: (<>
                Are you sure you want to reset the server data path? <br />
                <br />
                <strong>This will not delete any resource files or database</strong>, but just reset the txAdmin configuration, allowing you to go back to the Setup page. <br />
                If you want, you can set the path back to the current value later. <br />
                <br />
                <strong className="text-warning-inline">Warning:</strong> take note of the current path before proceeding, so you can set it back later if you need to. Current path:
                <Input value={dataPath.initialValue} className="mt-2" readOnly />
            </>),
            onConfirm: () => {
                setIsResettingServerData(true);
                resetServerDataApi({
                    toastLoadingMessage: 'Resetting server data path...',
                    success: (data, toastId) => {
                        if (data.type === 'success') {
                            setLocation('/server/setup');
                        }
                    },
                    finally: () => setIsResettingServerData(false),
                });
            },
        });

    }


    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
            advanced={{
                showing: showAdvanced,
                toggle: setShowAdvanced
            }}
        >
            <SettingItem label="Server Data Folder" htmlFor={dataPath.eid} required>
                <div className="flex gap-2">
                    <Input
                        id={dataPath.eid}
                        ref={dataPathRef}
                        defaultValue={dataPath.initialValue}
                        placeholder={serverDataPlaceholder}
                        onInput={processChanges}
                        disabled={pageCtx.isReadOnly}
                        required
                    />
                    <Button
                        className="grow border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        variant="outline"
                        disabled={pageCtx.isReadOnly || !hasPerm('all_permissions') || isResettingServerData}
                        onClick={handleResetServerData}
                    >
                        <Undo2Icon className="mr-2 h-4 w-4" /> Reset
                    </Button>
                </div>
                <SettingItemDesc>
                    The full path of the folder that <strong>contains</strong> the <InlineCode>resources</InlineCode> folder, usually it's the same place that contains your <InlineCode>server.cfg</InlineCode>. <br />
                    Resetting this value will allow you to go back to the Setup page, without deleting any files.
                    {pageCtx.apiData?.dataPath && pageCtx.apiData?.hasCustomDataPath && (<>
                        <br />
                        <span className="text-warning-inline">
                            {window.txConsts.hostConfigSource}: This path should start with <InlineCode>{pageCtx.apiData.dataPath}</InlineCode> .
                        </span>
                    </>)}
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Restart Schedule" showOptional>
                <RestartScheduleBox
                    restartTimes={restarterSchedule.state.value}
                    setRestartTimes={restarterSchedule.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <TimeZoneWarning />
                <SettingItemDesc>
                    At which times of day to restart the server. <br />
                    <strong>Note:</strong> Make sure your schedule matches your server time and not your local time.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Quiet Mode">
                <SwitchText
                    id={quietMode.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    checked={forceQuietMode || quietMode.state.value}
                    onCheckedChange={quietMode.state.set}
                    disabled={pageCtx.isReadOnly || forceQuietMode}
                />
                <SettingItemDesc>
                    Do not print FXServer's output to the terminal. <br />
                    You will still be able to use the Live Console.
                    {forceQuietMode && (<>
                        <br />
                        <span className="text-warning-inline">{window.txConsts.hostConfigSource}: This setting is locked and cannot be changed.</span>
                    </>)}
                </SettingItemDesc>
            </SettingItem>

            {showAdvanced && <AdvancedDivider />}

            <SettingItem label="CFG File Path" htmlFor={cfgPath.eid} showIf={showAdvanced} required>
                <Input
                    id={cfgPath.eid}
                    ref={cfgPathRef}
                    defaultValue={cfgPath.initialValue}
                    placeholder="server.cfg"
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                    required
                />
                <SettingItemDesc>
                    The path to your server config file, probably named <InlineCode>server.cfg</InlineCode>. <br />
                    This can either be absolute, or relative to the Server Data folder.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Startup Arguments" htmlFor={startupArgs.eid} showIf={showAdvanced}>
                <Input
                    id={startupArgs.eid}
                    ref={startupArgsRef}
                    defaultValue={inputArrayUtil.toUi(startupArgs.initialValue)}
                    placeholder="--trace-warning"
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Additional command-line arguments to pass to the FXServer instance such as NodeJS CLI flags. <br />
                    <strong>Warning:</strong> You almost certainly should not use this option, commands and convars should be placed in your <InlineCode>server.cfg</InlineCode> instead.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="OneSync" htmlFor={onesync.eid} showIf={showAdvanced}>
                <Select
                    value={onesync.state.value}
                    onValueChange={onesync.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={onesync.eid}>
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
            <SettingItem label="Autostart" showIf={showAdvanced}>
                <SwitchText
                    id={autoStart.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    checked={autoStart.state.value}
                    onCheckedChange={autoStart.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Start the server automatically after <strong>txAdmin</strong> starts.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Resource Starting Tolerance" htmlFor={resourceTolerance.eid} showIf={showAdvanced}>
                <Select
                    value={selectNumberUtil.toUi(resourceTolerance.state.value)}
                    onValueChange={(val) => resourceTolerance.state.set(selectNumberUtil.toCfg(val))}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={resourceTolerance.eid}>
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
        </SettingsCardShell>
    )
}
