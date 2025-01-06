import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, Loader2Icon } from "lucide-react"
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { SettingTabsDatum } from './SettingsPage'

function AdvancedDivider() {
    return (
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <hr className="w-full border-t" />
            </div>
            <div className="relative flex justify-center tracking-wider text-xs">
                <span className="bg-background px-2 text-muted-foreground/75">
                    Advanced Options
                </span>
            </div>
        </div>
    )
}


type ButtonsRowProps = {
    groupName: string;
    hasAdvanced: boolean;
    isAdvancedShown: boolean;
    saveDisabled: boolean;
    saveLoading: boolean;
    onClickSave: () => void;
    onToggleAdvanced: () => void;
}
function ButtonsRow(props: ButtonsRowProps) {
    return (
        <div className="flex flex-wrap-reverse justify-center xs:justify-start gap-2">
            <Button
                size='xs'
                disabled={props.saveDisabled || props.saveLoading}
                onClick={props.onClickSave}
            >
                Save {props.groupName} Settings
                {props.saveLoading && (
                    <Loader2Icon className="h-3.5 mt-0.5 inline animate-spin" />
                )}
            </Button>
            {props.hasAdvanced ? (
                <Button
                    size='xs'
                    variant={'muted'}
                    onClick={props.onToggleAdvanced}
                >
                    {props.isAdvancedShown ? 'Hide' : 'Show'} Advanced
                    {props.isAdvancedShown
                        ? <ChevronUpIcon className="size-4 ml-1.5" />
                        : <ChevronDownIcon className="size-4 ml-1.5" />}
                </Button>
            ) : null}
        </div>
    )
}


function SettingsGroup({ id, tabName, groupName, MainGroup, AdvancedGroup }: SettingsGroupProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [animationParent] = useAutoAnimate();

    return (
        <div id={id} data-show-advanced={showAdvanced} className='group/card'>
            <Card className="xs:x bg-transparent max-xs:rounded-none max-xs:shadow-none">
                <ol className="bg-muted/50 border-b p-4 flex flex-wrap items-center gap-1 sm:gap-2.5 select-none text-sm text-muted-foreground tracking-wide">
                    {groupName ? (
                        <>
                            <li>{tabName}</li>
                            <ChevronRightIcon className='size-3.5 mt-0.5 inline align-text-top opacity-75' />
                            <li>{groupName} Settings</li>
                        </>
                    ) : (
                        <li>{tabName} Settings</li>
                    )}
                </ol>

                <CardContent
                    className="space-y-6 pt-6 bg-transparent overflow-x-clip"
                    ref={animationParent}
                >
                    <MainGroup />
                    {showAdvanced && AdvancedGroup ? (<>
                        <AdvancedDivider />
                        <AdvancedGroup />
                    </>) : null}
                    <ButtonsRow
                        groupName={groupName ?? tabName}
                        hasAdvanced={!!AdvancedGroup}
                        isAdvancedShown={showAdvanced}
                        saveDisabled={false}
                        saveLoading={false}
                        onClickSave={() => { }}
                        onToggleAdvanced={() => setShowAdvanced(x => !x)}
                    />
                </CardContent>
            </Card>
        </div>
    )
};

type SettingsGroupProps = {
    id: string;
    tabName: string;
    groupName?: string;
    MainGroup: React.FC;
    AdvancedGroup?: React.FC;
}


export default function SettingsTab({ tab }: SettingsTabProps) {
    if ('groups' in tab) {
        return (
            <div id={tab.id} className='space-y-4'>
                {tab.groups.map((group) => (
                    <SettingsGroup
                        key={group.id}
                        id={`${tab.id}-${group.id}`}
                        tabName={tab.name}
                        groupName={group.name}
                        MainGroup={group.MainGroup}
                        AdvancedGroup={group.AdvancedGroup}
                    />
                ))}
            </div>
        )
    } else {
        return (
            <SettingsGroup
                key={tab.id}
                id={tab.id}
                tabName={tab.name}
                MainGroup={tab.MainGroup}
                AdvancedGroup={tab.AdvancedGroup}
            />
        )
    }
};

type SettingsTabProps = {
    tab: SettingTabsDatum;
}
