import { Input } from "@/components/ui/input"
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { useState } from "react";


export function MainGroup() {
    const [pageKey, setPageKey] = useState('Tab');

    const handlePageKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!e.metaKey) e.preventDefault();

        if (["Escape", "Backspace"].includes(e.code)) {
            setPageKey('Tab');
        } else {
            setPageKey(e.code);
        }
    }

    return (<>
        <SettingItem label="Game Menu">
            <SwitchText
                id="menuEnabled"
                checkedLabel="Enabled"
                uncheckedLabel="Disabled"
                variant="checkedGreen"
            />
            <SettingItemDesc>
                When enabled, admins will be able to open the menu by typing <InlineCode>/tx</InlineCode> or using the keybind configured in the FiveM/RedM settings.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Align Right">
            <SwitchText
                id="alignRight"
                checkedLabel="Right aligned"
                uncheckedLabel="Left aligned"
            />
            <SettingItemDesc>
                Move menu to the right side of the screen.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Menu Page Switch Key" htmlFor="pageKey">
            <Input
                id="pageKey"
                value={pageKey}
                placeholder="click here and use the key to change"
                onKeyDown={handlePageKey}
                className="font-mono"
                readOnly
            />
            <SettingItemDesc>
                The key used to to switch tabs in the menu. <br />
                Click above and press any key to change the configuration. <br />
                <strong>Note:</strong> The default is <InlineCode>Tab</InlineCode>, and you cannot use <InlineCode>Escape</InlineCode> or <InlineCode>Backspace</InlineCode>.
            </SettingItemDesc>
        </SettingItem>
    </>)
}


export function AdvancedGroup() {
    return (<>
        <SettingItem label="Player Mode Change Effect">
            <SwitchText
                id="ptfxDisabled"
                checkedLabel="Enabled"
                uncheckedLabel="Disabled"
                variant="checkedGreen"
            />
            <SettingItemDesc>
                Play a particle effect and sound when an admin uses NoClip, God Mode, etc. <br />
                <strong className="text-warning-inline">Warning:</strong> This options help prevent admin abuse during PvP by making it visible/audible to all players that an admin is using a special mode. We recommend keeping it enabled.
            </SettingItemDesc>
        </SettingItem>
    </>)
}
