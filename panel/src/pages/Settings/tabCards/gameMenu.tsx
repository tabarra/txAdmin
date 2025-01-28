import { Input } from "@/components/ui/input"
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems'
import { useEffect, useState } from "react";
import { diffConfig, SettingsCardProps, useConfAccessor } from "../utils";
import SettingsCardShell from "../SettingsCardShell";


export default function ConfigCardGameMenu({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const menuEnabled = conf('gameFeatures', 'menuEnabled');
    const alignRight = conf('gameFeatures', 'menuAlignRight');
    const pageKey = conf('gameFeatures', 'menuPageKey');
    const playerModePtfx = conf('gameFeatures', 'playerModePtfx');

    //Check against stored value and sets the page state
    const processChanges = () => {
        if (!pageCtx.apiData) return;

        const diff = diffConfig([
            //FIXME: add config accessors here
            [menuEnabled, menuEnabled.state.value],
            [alignRight, alignRight.state.value],
            [pageKey, pageKey.state.value],
            [playerModePtfx, playerModePtfx.state.value],
        ]);
        pageCtx.setCardPendingSave(diff ? cardCtx : null);
        return diff;
    }

    //Validate changes and trigger the save API
    const handleOnSave = () => {
        const changes = processChanges();
        if (!changes) return;

        //FIXME:NC do validation
        pageCtx.saveChanges(cardCtx, changes);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        showAdvanced, //for referenced inputs
        menuEnabled.state.value,
        alignRight.state.value,
        pageKey.state.value,
        playerModePtfx.state.value,
    ]);

    //Resets advanced settings when toggling the advanced switch
    useEffect(() => {
        if (showAdvanced) return;
        playerModePtfx.state.discard();
    }, [showAdvanced]);

    //Card content stuff
    const handlePageKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!e.metaKey) e.preventDefault();

        if (["Escape", "Backspace"].includes(e.code)) {
            pageKey.state.set('Tab');
        } else {
            pageKey.state.set(e.code);
        }
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
            <SettingItem label="Game Menu">
                <SwitchText
                    id={menuEnabled.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    variant="checkedGreen"
                    checked={menuEnabled.state.value}
                    onCheckedChange={menuEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    When enabled, admins will be able to open the menu by typing <InlineCode>/tx</InlineCode> or using the keybind configured in the FiveM/RedM settings.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Align Right">
                <SwitchText
                    id={alignRight.eid}
                    checkedLabel="Right aligned"
                    uncheckedLabel="Left aligned"
                    checked={alignRight.state.value}
                    onCheckedChange={alignRight.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Move menu to the right side of the screen.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Menu Page Switch Key" htmlFor={pageKey.eid}>
                <Input
                    id={pageKey.eid}
                    value={pageKey.state.value}
                    placeholder='click here and use the key to change'
                    onKeyDown={handlePageKey}
                    className="font-mono"
                    readOnly
                    onChange={processChanges}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    The key used to to switch tabs in the menu. <br />
                    Click above and press any key to change the configuration. <br />
                    <strong>Note:</strong> The default is <InlineCode>Tab</InlineCode>, and you cannot use <InlineCode>Escape</InlineCode> or <InlineCode>Backspace</InlineCode>.
                </SettingItemDesc>
            </SettingItem>

            {showAdvanced && <AdvancedDivider />}

            <SettingItem label="Player Mode Change Effect" showIf={showAdvanced}>
                <SwitchText
                    id={playerModePtfx.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    variant="checkedGreen"
                    checked={playerModePtfx.state.value}
                    onCheckedChange={playerModePtfx.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Play a particle effect and sound when an admin uses NoClip, God Mode, etc. <br />
                    <strong className="text-warning-inline">Warning:</strong> This options help prevent admin abuse during PvP by making it visible/audible to all players that an admin is using a special mode. We recommend keeping it enabled.
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
