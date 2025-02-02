/**
 * This template is used to serve as a starting point for creating new settings cards or copying components.
 */
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SwitchText from '@/components/SwitchText'
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems'
import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { processConfigStates, SettingsCardProps, useConfAccessor } from "../utils"
import SettingsCardShell from "../SettingsCardShell"
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import { RadioGroup } from "@/components/ui/radio-group"
import BigRadioItem from "@/components/BigRadioItem"
import InlineCode from "@/components/InlineCode"


type ItemWithStateProps = {
    value: number | undefined;
    setValue: React.Dispatch<React.SetStateAction<number | undefined>>
    disabled?: boolean;
};

function ItemWithState({ value, setValue, disabled }: ItemWithStateProps) {
    return (
        <div className="py-3 px-2 min-h-[4.5rem] flex items-center border rounded-lg font-mono gap-2">
            <Button onClick={() => value !== undefined && setValue(value - 1)} disabled={disabled}>
                \/
            </Button>
            <Button disabled>
                {value}
            </Button>
            <Button onClick={() => value !== undefined && setValue(value + 1)} disabled={disabled}>
                /\
            </Button>
        </div>
    )
}


/**
 * Settings card template - copy this to create a new card
 */
export default function SettingsCardTemplate({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const booleanSwitch = conf('server', 'quiet');
    const selectString = conf('server', 'onesync');
    const normalInput = conf('general', 'serverName');
    const normalInputRef = useRef<HTMLInputElement | null>(null);
    const textareaInput = conf('whitelist', 'rejectionMessage');
    const textareaInputRef = useRef<AutosizeTextAreaRef | null>(null);
    const selectNumber = conf('restarter', 'resourceStartingTolerance');
    const inputArray = conf('server', 'startupArgs');
    const inputArrayRef = useRef<HTMLInputElement | null>(null);
    const nullableInput = conf('server', 'dataPath');
    const nullableInputRef = useRef<HTMLInputElement | null>(null);
    const customComponent = conf('restarter', 'bootCooldown');
    const bigRadio = conf('whitelist', 'mode');

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

        let currInputArray;
        if (inputArrayRef.current) {
            currInputArray = inputArrayUtil.toCfg(inputArrayRef.current.value);
        }
        const diff = processConfigStates([
            [booleanSwitch, booleanSwitch.state.value],
            [selectString, selectString.state.value],
            [normalInput, normalInputRef.current?.value],
            [textareaInput, textareaInputRef.current?.textArea.value],
            [selectNumber, selectNumber.state.value],
            [inputArray, currInputArray],
            [nullableInput, emptyToNull(nullableInputRef.current?.value)],
            [customComponent, customComponent.state.value],
            [bigRadio, bigRadio.state.value],
        ]);
        pageCtx.setCardPendingSave(diff ? cardCtx : null);
        return diff;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
        if (!hasChanges) return;

        //FIXME: do validation
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        showAdvanced, //for referenced inputs
        //NOTE: every config that uses the state needs to be listed here
        booleanSwitch.state.value,
        selectString.state.value,
        selectNumber.state.value,
        customComponent.state.value,
        bigRadio.state.value,
    ]);

    //Resets advanced settings when toggling the advanced switch
    useEffect(() => {
        if (showAdvanced) return;
        //NOTE: every advanced config that uses the state needs to be reset here
        customComponent.state.discard();
        bigRadio.state.discard();
    }, [showAdvanced]);

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
            <h2 className="text-2xl text-warning-inline">Simple Examples</h2>

            <SettingItem label="Switch">
                <SwitchText
                    id={booleanSwitch.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    checked={booleanSwitch.state.value}
                    onCheckedChange={booleanSwitch.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Select String" htmlFor={selectString.eid}>
                <Select
                    value={selectString.state.value}
                    onValueChange={selectString.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={selectString.eid}>
                        <SelectValue placeholder="Lorem ipsum dolor..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="on">On (recommended)</SelectItem>
                        <SelectItem value="legacy">Legacy</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                </Select>
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Normal Input" htmlFor={normalInput.eid}>
                <Input
                    id={normalInput.eid}
                    ref={normalInputRef}
                    defaultValue={normalInput.initialValue}
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                    placeholder={'example'}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Textarea" htmlFor={textareaInput.eid}>
                <AutosizeTextarea
                    id={textareaInput.eid}
                    ref={textareaInputRef}
                    placeholder='Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
                    defaultValue={textareaInput.initialValue}
                    onChange={processChanges} //FIXME: test this vs onInput on AutosizeTextarea
                    autoComplete="off"
                    minHeight={60}
                    maxHeight={180}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <h2 className="text-2xl text-warning-inline">Compex Examples (data marshalling)</h2>

            <SettingItem label="Select Number" htmlFor={selectNumber.eid}>
                <Select
                    value={selectNumberUtil.toUi(selectNumber.state.value)}
                    onValueChange={(val) => selectNumber.state.set(selectNumberUtil.toCfg(val))}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={selectNumber.eid}>
                        <SelectValue placeholder="Lorem ipsum dolor..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="90">1.5 minutes (default)</SelectItem>
                        <SelectItem value="180">3 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                    </SelectContent>
                </Select>
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Input Array" htmlFor={inputArray.eid}>
                <Input
                    id={inputArray.eid}
                    ref={inputArrayRef}
                    defaultValue={inputArrayUtil.toUi(inputArray.initialValue)}
                    placeholder="example1, example2"
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Nullable Input" htmlFor={nullableInput.eid}>
                <Input
                    id={nullableInput.eid}
                    ref={nullableInputRef}
                    defaultValue={nullableInput.initialValue}
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                    placeholder={'example'}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            {showAdvanced && <AdvancedDivider />}
            {showAdvanced && <h2 className="text-2xl text-warning-inline">Advanced Examples (custom components)</h2>}

            <SettingItem label="Custom Component" showIf={showAdvanced}>
                <ItemWithState
                    value={customComponent.state.value}
                    setValue={customComponent.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Big Radio" showIf={showAdvanced}>
                <RadioGroup
                    value={bigRadio.state.value}
                    onValueChange={bigRadio.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <BigRadioItem
                        groupValue={bigRadio.state.value}
                        value="disabled"
                        title="Disabled"
                        desc="desc as text"
                    />
                    <BigRadioItem
                        groupValue={bigRadio.state.value}
                        value="adminOnly"
                        title="Admin-only (maintenance mode)"
                        desc={(<>
                            desc as <InlineCode className="text-warning-inline">JSX</InlineCode>
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={bigRadio.state.value}
                        value="guildMember"
                        title="Discord Guild Member"
                        desc="desc as text"
                    />
                </RadioGroup>
            </SettingItem>

        </SettingsCardShell>
    )
}
