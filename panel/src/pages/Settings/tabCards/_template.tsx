/**
 * This template is used to serve as a starting point for creating new settings cards or copying components.
 */
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SwitchText from '@/components/SwitchText'
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems'
import { useState, useEffect, useRef, useMemo, useReducer } from "react"
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils"
import { Button } from "@/components/ui/button"
import SettingsCardShell from "../SettingsCardShell"
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import { RadioGroup } from "@/components/ui/radio-group"
import BigRadioItem from "@/components/BigRadioItem"
import InlineCode from "@/components/InlineCode"


type ItemWithStateProps = {
    value: number | undefined;
    setValue: (value: number | undefined) => void;
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


export const pageConfigs = {
    booleanSwitch: getPageConfig('server', 'quiet'),
    selectString: getPageConfig('server', 'onesync'),
    normalInput: getPageConfig('general', 'serverName'),
    textareaInput: getPageConfig('whitelist', 'rejectionMessage'),
    selectNumber: getPageConfig('restarter', 'resourceStartingTolerance'),
    inputArray: getPageConfig('server', 'startupArgs'),
    nullableInput: getPageConfig('server', 'dataPath'),

    customComponent: getPageConfig('restarter', 'bootGracePeriod', true),
    bigRadio: getPageConfig('whitelist', 'mode', true),
} as const;


/**
 * Settings card template - copy this to create a new card
 */
export default function SettingsCardTemplate({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [states, dispatch] = useReducer(
        configsReducer<typeof pageConfigs>,
        null,
        () => getConfigEmptyState(pageConfigs),
    );
    const cfg = useMemo(() => {
        return getConfigAccessors(cardCtx.cardId, pageConfigs, pageCtx.apiData, dispatch);
    }, [pageCtx.apiData, dispatch]);

    //Effects - handle changes and reset advanced settings
    useEffect(() => {
        updatePageState();
    }, [states]);
    useEffect(() => {
        if (showAdvanced) return;
        Object.values(cfg).forEach(c => c.isAdvanced && c.state.discard());
    }, [showAdvanced]);

    //Refs for configs that don't use state
    const normalInputRef = useRef<HTMLInputElement | null>(null);
    const textareaInputRef = useRef<AutosizeTextAreaRef | null>(null);
    const inputArrayRef = useRef<HTMLInputElement | null>(null);
    const nullableInputRef = useRef<HTMLInputElement | null>(null);

    //Marshalling Utils
    const selectNumberUtil = {
        toUi: (num?: number) => num ? num.toString() : undefined,
        toCfg: (str?: string) => str ? parseInt(str) : undefined,
    }
    const inputArrayUtil = {
        toUi: (args?: string[]) => args ? args.join(' ') : '',
        toCfg: (str?: string) => str ? str.trim().split(/\s+/) : [],
    }
    const emptyToNull = (str?: string) => {
        if (str === undefined) return undefined;
        const trimmed = str.trim();
        return trimmed.length ? trimmed : null;
    };

    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        let currInputArray;
        if (inputArrayRef.current) {
            currInputArray = inputArrayUtil.toCfg(inputArrayRef.current.value);
        }
        const overwrites = {
            normalInput: normalInputRef.current?.value,
            textareaInput: textareaInputRef.current?.textArea.value,
            inputArray: currInputArray,
            nullableInput: emptyToNull(nullableInputRef.current?.value),
        };

        const res = getConfigDiff(cfg, states, overwrites, showAdvanced);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;

        //FIXME: do validation
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
            advancedVisible={showAdvanced}
            advancedSetter={setShowAdvanced}
        >
            <h2 className="text-2xl text-warning-inline">Simple Examples</h2>

            <SettingItem label="Switch">
                <SwitchText
                    id={cfg.booleanSwitch.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    checked={states.booleanSwitch}
                    onCheckedChange={cfg.booleanSwitch.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Select String" htmlFor={cfg.selectString.eid}>
                <Select
                    value={states.selectString}
                    onValueChange={cfg.selectString.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={cfg.selectString.eid}>
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

            <SettingItem label="Normal Input" htmlFor={cfg.normalInput.eid}>
                <Input
                    id={cfg.normalInput.eid}
                    ref={normalInputRef}
                    defaultValue={cfg.normalInput.initialValue}
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                    placeholder={'example'}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Textarea" htmlFor={cfg.textareaInput.eid}>
                <AutosizeTextarea
                    id={cfg.textareaInput.eid}
                    ref={textareaInputRef}
                    placeholder='Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
                    defaultValue={cfg.textareaInput.initialValue}
                    onChange={updatePageState} //FIXME: test this vs onInput on AutosizeTextarea
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

            <SettingItem label="Select Number" htmlFor={cfg.selectNumber.eid}>
                <Select
                    value={selectNumberUtil.toUi(states.selectNumber)}
                    onValueChange={(val) => cfg.selectNumber.state.set(selectNumberUtil.toCfg(val))}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={cfg.selectNumber.eid}>
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

            <SettingItem label="Input Array" htmlFor={cfg.inputArray.eid}>
                <Input
                    id={cfg.inputArray.eid}
                    ref={inputArrayRef}
                    defaultValue={inputArrayUtil.toUi(cfg.inputArray.initialValue)}
                    placeholder="example1, example2"
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Nullable Input" htmlFor={cfg.nullableInput.eid}>
                <Input
                    id={cfg.nullableInput.eid}
                    ref={nullableInputRef}
                    defaultValue={cfg.nullableInput.initialValue}
                    onInput={updatePageState}
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
                    value={states.customComponent}
                    setValue={cfg.customComponent.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </SettingItemDesc>
            </SettingItem>

            <SettingItem label="Big Radio" showIf={showAdvanced}>
                <RadioGroup
                    value={states.bigRadio}
                    onValueChange={cfg.bigRadio.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <BigRadioItem
                        groupValue={states.bigRadio}
                        value="disabled"
                        title="Disabled"
                        desc="desc as text"
                    />
                    <BigRadioItem
                        groupValue={states.bigRadio}
                        value="adminOnly"
                        title="Admin-only (maintenance mode)"
                        desc={(<>
                            desc as <InlineCode className="text-warning-inline">JSX</InlineCode>
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.bigRadio}
                        value="discordMember"
                        title="Discord Server Member"
                        desc="desc as text"
                    />
                </RadioGroup>
            </SettingItem>

        </SettingsCardShell>
    )
}
