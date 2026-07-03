import { Input } from "@/components/ui/input";
import SwitchText from '@/components/SwitchText';
import InlineCode from '@/components/InlineCode';
import { AdvancedDivider, SettingItem, SettingItemDesc } from '../settingsItems';
import { useState, useEffect, useMemo, useReducer } from "react";
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils";
import SettingsCardShell from "../SettingsCardShell";
import { txToast } from "@/components/TxToaster";


export const pageConfigs = {
    menuEnabled: getPageConfig('gameFeatures', 'menuEnabled'),
    alignRight: getPageConfig('gameFeatures', 'menuAlignRight'),
    pageKey: getPageConfig('gameFeatures', 'menuPageKey'),
    playerModePtfx: getPageConfig('gameFeatures', 'playerModePtfx'),
    jailRoutingBucket: getPageConfig('gameFeatures', 'jailRoutingBucket', true),
    jailPosFivem: getPageConfig('gameFeatures', 'jailPosFivem', true),
    jailPosRedm: getPageConfig('gameFeatures', 'jailPosRedm', true),
} as const;

const coordsRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

export default function ConfigCardGameMenu({ cardCtx, pageCtx }: SettingsCardProps) {
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


    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        const overwrites = {};

        const res = getConfigDiff(cfg, states, overwrites, showAdvanced);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }


    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;
        for (const cfgName of ['jailPosFivem', 'jailPosRedm'] as const) {
            const value = localConfigs.gameFeatures?.[cfgName];
            if (value !== undefined && !coordsRegex.test(value)) {
                return txToast.error({
                    title: 'Invalid jail position.',
                    msg: 'The coordinates must be in the "x, y, z" format.',
                });
            }
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Card content stuff
    const handlePageKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!e.metaKey) e.preventDefault();

        if (["Escape", "Backspace"].includes(e.code)) {
            cfg.pageKey.state.set('Tab');
        } else {
            cfg.pageKey.state.set(e.code);
        }
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
            advancedVisible={showAdvanced}
            advancedSetter={setShowAdvanced}
        >
            <SettingItem label="Game Menu">
                <SwitchText
                    id={cfg.menuEnabled.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    variant="checkedGreen"
                    checked={states.menuEnabled}
                    onCheckedChange={cfg.menuEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    When enabled, admins will be able to open the menu by typing <InlineCode>/tx</InlineCode> or using the keybind configured in the FiveM/RedM settings.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Align Menu Right">
                <SwitchText
                    id={cfg.alignRight.eid}
                    checkedLabel="Right aligned"
                    uncheckedLabel="Left aligned"
                    checked={states.alignRight}
                    onCheckedChange={cfg.alignRight.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Move menu to the right side of the screen.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Menu Page Switch Key" htmlFor={cfg.pageKey.eid} required>
                <Input
                    id={cfg.pageKey.eid}
                    value={states.pageKey}
                    placeholder='click here and use the key to change'
                    onKeyDown={handlePageKey}
                    className="font-mono"
                    readOnly
                    onInput={updatePageState}
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
                    id={cfg.playerModePtfx.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    variant="checkedGreen"
                    checked={states.playerModePtfx}
                    onCheckedChange={cfg.playerModePtfx.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Play a particle effect and sound when an admin uses NoClip, God Mode, etc. <br />
                    <strong className="text-warning-inline">Warning:</strong> This options help prevent admin abuse during PvP by making it visible/audible to all players that an admin is using a special mode. We recommend keeping it enabled.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Jail Routing Bucket" htmlFor={cfg.jailRoutingBucket.eid} showIf={showAdvanced} required>
                <Input
                    id={cfg.jailRoutingBucket.eid}
                    type="number"
                    min={1}
                    max={1023}
                    value={states.jailRoutingBucket ?? ''}
                    onChange={(e) => cfg.jailRoutingBucket.state.set(parseInt(e.target.value) || undefined)}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    The routing bucket (dimension) that jailed players are moved to, isolating them from everyone else. <br />
                    <strong>Note:</strong> Make sure no other resource uses this bucket number.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Jail Position (FiveM)" htmlFor={cfg.jailPosFivem.eid} showIf={showAdvanced} required>
                <Input
                    id={cfg.jailPosFivem.eid}
                    value={states.jailPosFivem ?? ''}
                    placeholder='459.28, -1001.85, 24.91'
                    onChange={(e) => cfg.jailPosFivem.state.set(e.target.value)}
                    className="font-mono"
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    The coordinates (<InlineCode>x, y, z</InlineCode>) jailed players are teleported to on FiveM servers. The default is a Mission Row PD cell.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Jail Position (RedM)" htmlFor={cfg.jailPosRedm.eid} showIf={showAdvanced} required>
                <Input
                    id={cfg.jailPosRedm.eid}
                    value={states.jailPosRedm ?? ''}
                    placeholder='-276.0, 806.0, 119.38'
                    onChange={(e) => cfg.jailPosRedm.state.set(e.target.value)}
                    className="font-mono"
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    The coordinates (<InlineCode>x, y, z</InlineCode>) jailed players are teleported to on RedM servers. The default is a Valentine sheriff cell.
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
