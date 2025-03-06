import { Input } from "@/components/ui/input"
import TxAnchor from '@/components/TxAnchor'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { RadioGroup } from "@/components/ui/radio-group"
import BigRadioItem from "@/components/BigRadioItem"
import { useEffect, useRef, useMemo, useReducer } from "react"
import { getConfigEmptyState, getConfigAccessors, SettingsCardProps, getPageConfig, configsReducer, getConfigDiff } from "../utils"
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import SettingsCardShell from "../SettingsCardShell"
import { txToast } from "@/components/TxToaster"
import consts from "@shared/consts"


export const pageConfigs = {
    whitelistMode: getPageConfig('whitelist', 'mode'),
    rejectionMessage: getPageConfig('whitelist', 'rejectionMessage'),
    discordRoles: getPageConfig('whitelist', 'discordRoles'),
} as const;

export default function ConfigCardWhitelist({ cardCtx, pageCtx }: SettingsCardProps) {
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

    //Refs for configs that don't use state
    const rejectionMessageRef = useRef<AutosizeTextAreaRef | null>(null);
    const discordRolesRef = useRef<HTMLInputElement | null>(null);

    //Marshalling Utils
    const inputArrayUtil = {
        toUi: (args?: string[]) => args ? args.join(', ') : '',
        toCfg: (str?: string) => str ? str.split(/[,;]\s*/).map(x => x.trim()).filter(x => x.length) : [],
    }

    //Processes the state of the page and sets the card as pending save if needed
    const updatePageState = () => {
        let currDiscordRoles;
        if (discordRolesRef.current) {
            currDiscordRoles = inputArrayUtil.toCfg(discordRolesRef.current.value);
        }
        const overwrites = {
            rejectionMessage: rejectionMessageRef.current?.textArea.value,
            discordRoles: currDiscordRoles,
        };

        const res = getConfigDiff(cfg, states, overwrites, false);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { hasChanges, localConfigs } = updatePageState();
        if (!hasChanges) return;

        if (
            localConfigs.whitelist?.rejectionMessage
            && localConfigs.whitelist.rejectionMessage.length > 512
        ) {
            return txToast.error({
                title: 'The Whitelist Rejection Message is too big.',
                md: true,
                msg: 'The message must be 512 characters or less.',
            });
        }
        if (
            localConfigs.whitelist?.mode === 'discordMember'
            || localConfigs.whitelist?.mode === 'discordRoles'
        ) {
            if (pageCtx.apiData?.storedConfigs.discordBot?.enabled !== true) {
                return txToast.warning({
                    title: 'Discord Bot is required.',
                    msg: 'You need to enable the Discord Bot in the Discord tab to use Discord-based whitelist modes.',
                });
            }
            if (
                localConfigs.whitelist?.mode === 'discordRoles'
                && (
                    !Array.isArray(localConfigs.whitelist?.discordRoles)
                    || !localConfigs.whitelist?.discordRoles.length
                )
            ) {
                return txToast.warning({
                    title: 'Discord Roles are required.',
                    msg: 'You need to specify at least one Discord Role ID to use the "Discord Server Roles" whitelist mode.',
                });
            }
        }
        if (Array.isArray(localConfigs.whitelist?.discordRoles)) {
            const invalidRoles = localConfigs.whitelist.discordRoles
                .filter(x => !consts.regexDiscordSnowflake.test(x))
                .map(x => `- \`${x.slice(0, 20)}\``);
            if (invalidRoles.length) {
                return txToast.error({
                    title: 'Invalid Discord Role ID(s).',
                    md: true,
                    msg: 'The following Discord Role ID(s) are invalid: \n' + invalidRoles.join('\n'),
                });
            }
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="Whitelist Mode">
                <RadioGroup
                    value={states.whitelistMode}
                    onValueChange={cfg.whitelistMode.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="disabled"
                        title="Disabled"
                        desc="No whitelist status will be checked by txAdmin."
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="adminOnly"
                        title="Admin-only (maintenance mode)"
                        desc={(<>
                            Will only allow server join if your <InlineCode>fivem:</InlineCode> or <InlineCode>discord:</InlineCode> identifiers are attached to a txAdmin administrator. Also known as maintenance mode.
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="discordMember"
                        title="Discord Server Member"
                        desc={(<>
                            Checks if the player joining has a <InlineCode>discord:</InlineCode> identifier and is present in the Discord server configured in the Discord Tab.
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="discordRoles"
                        title="Discord Server Roles"
                        desc={(<>
                            Checks if the player joining has a <InlineCode>discord:</InlineCode> identifier and is present in the Discord server configured in the Discord Tab and has at least one of the roles specified below.
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={states.whitelistMode}
                        value="approvedLicense"
                        title="Approved License"
                        desc={(<>
                            The player <InlineCode>license:</InlineCode> identifier must be whitelisted by a txAdmin administrator. This can be done through the <TxAnchor href="/whitelist">Whitelist page</TxAnchor>, or the <InlineCode>/whitelist</InlineCode> Discord bot slash command.
                        </>)}
                    />
                </RadioGroup>
            </SettingItem>
            <SettingItem label="Whitelist Rejection Message" htmlFor={cfg.rejectionMessage.eid} showOptional>
                <AutosizeTextarea
                    id={cfg.rejectionMessage.eid}
                    ref={rejectionMessageRef}
                    placeholder='Please join http://discord.gg/example and request to be whitelisted.'
                    defaultValue={cfg.rejectionMessage.initialValue}
                    onInput={updatePageState}
                    autoComplete="off"
                    minHeight={60}
                    maxHeight={180}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Optional message to display to a player on the rejection message that shows when they try to connect while not being whitelisted. <br />
                    If you have a Discord whitelisting process, include here a invite link.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Whitelisted Discord Roles" htmlFor={cfg.discordRoles.eid}>
                <Input
                    id={cfg.discordRoles.eid}
                    ref={discordRolesRef}
                    defaultValue={inputArrayUtil.toUi(cfg.discordRoles.initialValue)}
                    placeholder="000000000000000000, 000000000000000000"
                    onInput={updatePageState}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    The ID of the Discord roles that are whitelisted to join the server. <br />
                    This field supports multiple roles, separated by comma. <br />
                    <strong>Note:</strong> Requires the whitelist mode to be set to "Discord Server Roles".
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
