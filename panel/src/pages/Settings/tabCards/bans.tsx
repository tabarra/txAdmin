import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'
import { PencilIcon } from 'lucide-react'
import SwitchText from '@/components/SwitchText'
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems'
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import { useEffect, useRef, useState } from "react"
import SettingsCardShell from "../SettingsCardShell"
import { processConfigStates, SettingsCardProps, useConfAccessor } from "../utils"
import { txToast } from "@/components/TxToaster"


export default function ConfigCardBans({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const checkingEnabled = conf('banlist', 'enabled');
    const rejectionMessage = conf('banlist', 'rejectionMessage');
    const rejectionMessageRef = useRef<AutosizeTextAreaRef | null>(null);
    const requiredHwids = conf('banlist', 'requiredHwidMatches');

    //Marshalling Utils
    const selectNumberUtil = {
        toUi: (num?: number) => num ? num.toString() : undefined,
        toCfg: (str?: string) => str ? parseInt(str) : undefined,
    }

    //Check against stored value and sets the page state
    const processChanges = () => {
        if (!pageCtx.apiData) {
            return {
                changedConfigs: {},
                hasChanges: false,
                localConfigs: {},
            }
        }

        const res = processConfigStates([
            [checkingEnabled, checkingEnabled.state.value],
            [rejectionMessage, rejectionMessageRef.current?.textArea.value],
            [requiredHwids, requiredHwids.state.value],
        ]);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
        if (!hasChanges) return;

        if (
            localConfigs.banlist?.rejectionMessage
            && localConfigs.banlist.rejectionMessage.length > 512
        ) {
            return txToast.error({
                title: 'The Ban Rejection Message is too big.',
                md: true,
                msg: 'The message must be 512 characters or less.',
            });
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        showAdvanced, //for referenced inputs
        checkingEnabled.state.value,
        requiredHwids.state.value,
    ]);

    //Resets advanced settings when toggling the advanced switch
    useEffect(() => {
        if (showAdvanced) return;
        requiredHwids.state.discard();
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
            <SettingItem label="Ban Checking">
                <SwitchText
                    id={checkingEnabled.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    checked={checkingEnabled.state.value}
                    onCheckedChange={checkingEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Enable checking for ban status on player join. <br />
                    <strong>Note:</strong> txAdmin bans will not work if this option is disabled.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Ban Templates">
                <Link asChild href="/settings/ban-templates">
                    <Button
                        size={'sm'}
                        variant="secondary"
                        disabled={pageCtx.isReadOnly}
                    >
                        <PencilIcon className='size-4 mr-1.5 inline-block' /> Edit Ban Templates
                    </Button>
                </Link>
                <SettingItemDesc>
                    Configure ban reasons and durations that will appear as dropdown options when banning a player. This is useful for common reasons that happen frequently, like violation of your server rules.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Ban Rejection Message" htmlFor={rejectionMessage.eid} showOptional>
                <AutosizeTextarea
                    id={rejectionMessage.eid}
                    ref={rejectionMessageRef}
                    placeholder='You can join http://discord.gg/example to appeal this ban.'
                    defaultValue={rejectionMessage.initialValue}
                    onChange={processChanges}
                    autoComplete="off"
                    minHeight={60}
                    maxHeight={180}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Optional message to display to a player on the rejection message that shows when they try to connect while being banned. <br />
                    If you have a ban appeal process, you can use this field to inform the players.
                </SettingItemDesc>
            </SettingItem>

            {showAdvanced && <AdvancedDivider />}

            <SettingItem label="Required Ban HWID Matches" showIf={showAdvanced}>
                <Select
                    value={selectNumberUtil.toUi(requiredHwids.state.value)}
                    onValueChange={(val) => requiredHwids.state.set(selectNumberUtil.toCfg(val))}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={requiredHwids.eid}>
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 - recommended</SelectItem>
                        <SelectItem value="2">2 - lax</SelectItem>
                        <SelectItem value="3">3 - very lax</SelectItem>
                        <SelectItem value="4">4 - virtually disabled</SelectItem>
                        <SelectItem value="0">Disable HWID Bans</SelectItem>
                    </SelectContent>
                </Select>
                <SettingItemDesc>
                    This option configures how many HWID tokens must match between a player and an existing ban for the player join to be blocked, or can disable HWID Bans entirely. <br />
                    Since Hardware ID Tokens are not guaranteed to be unique, there is the possibility of tokens from two players matching without them being related to each other. <br />
                    <strong>Note:</strong> Most players have 3 to 6 HWID tokens.
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
