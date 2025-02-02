import { Input } from "@/components/ui/input"
import TxAnchor from '@/components/TxAnchor'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { RadioGroup } from "@/components/ui/radio-group"
import BigRadioItem from "@/components/BigRadioItem"
import { useEffect, useRef } from "react"
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea"
import { processConfigStates, SettingsCardProps, useConfAccessor } from "../utils"
import SettingsCardShell from "../SettingsCardShell"
import { txToast } from "@/components/TxToaster"
import consts from "@shared/consts"


export default function ConfigCardWhitelist({ cardCtx, pageCtx }: SettingsCardProps) {
    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const whitelistMode = conf('whitelist', 'mode');
    const rejectionMessage = conf('whitelist', 'rejectionMessage');
    const rejectionMessageRef = useRef<AutosizeTextAreaRef | null>(null);
    const discordRoles = conf('whitelist', 'discordRoles');
    const discordRolesRef = useRef<HTMLInputElement | null>(null);

    //Marshalling Utils
    const inputArrayUtil = {
        toUi: (args?: string[]) => args ? args.join(', ') : undefined,
        toCfg: (str?: string) => str ? str.split(/[,;]\s*/).map(x => x.trim()).filter(x => x.length) : undefined,
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

        let currDiscordRoles;
        if (discordRolesRef.current) {
            currDiscordRoles = inputArrayUtil.toCfg(discordRolesRef.current.value);
        }
        const res = processConfigStates([
            [whitelistMode, whitelistMode.state.value],
            [rejectionMessage, rejectionMessageRef.current?.textArea.value],
            [discordRoles, currDiscordRoles],
        ]);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
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
            localConfigs.whitelist?.mode === 'guildMember'
            || localConfigs.whitelist?.mode === 'guildRoles'
        ) {
            if (pageCtx.apiData?.storedConfigs.discordBot?.enabled !== true) {
                return txToast.warning({
                    title: 'Discord Bot is required.',
                    msg: 'You need to enable the Discord Bot in the Discord tab to use Discord-based whitelist modes.',
                });
            }
            if (
                localConfigs.whitelist?.mode === 'guildRoles'
                && (
                    !Array.isArray(localConfigs.whitelist?.discordRoles)
                    || !localConfigs.whitelist?.discordRoles.length
                )
            ) {
                return txToast.warning({
                    title: 'Discord Roles are required.',
                    msg: 'You need to specify at least one Discord Role ID to use the "Discord Guild Roles" whitelist mode.',
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

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        whitelistMode.state.value,
    ]);

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="Whitelist Mode">
                <RadioGroup
                    value={whitelistMode.state.value}
                    onValueChange={whitelistMode.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <BigRadioItem
                        groupValue={whitelistMode.state.value}
                        value="disabled"
                        title="Disabled"
                        desc="No whitelist status will be checked by txAdmin."
                    />
                    <BigRadioItem
                        groupValue={whitelistMode.state.value}
                        value="adminOnly"
                        title="Admin-only (maintenance mode)"
                        desc={(<>
                            Will only allow server join if your <InlineCode>fivem:</InlineCode> or <InlineCode>discord:</InlineCode> identifiers are attached to a txAdmin administrator. Also known as maintenance mode.
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={whitelistMode.state.value}
                        value="guildMember"
                        title="Discord Guild Member"
                        desc={(<>
                            Checks if the player joining has a <InlineCode>discord:</InlineCode> identifier and is present in the Discord guild configured in the Discord Tab.
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={whitelistMode.state.value}
                        value="guildRoles"
                        title="Discord Guild Roles"
                        desc={(<>
                            Checks if the player joining has a <InlineCode>discord:</InlineCode> identifier and is present in the Discord guild configured in the Discord Tab and has at least one of the roles specified below.
                        </>)}
                    />
                    <BigRadioItem
                        groupValue={whitelistMode.state.value}
                        value="approvedLicense"
                        title="Approved License"
                        desc={(<>
                            The player <InlineCode>license:</InlineCode> identifier must be whitelisted by a txAdmin administrator. This can be done through the <TxAnchor href="/whitelist">Whitelist page</TxAnchor>, or the <InlineCode>/whitelist</InlineCode> Discord bot slash command.
                        </>)}
                    />
                </RadioGroup>
            </SettingItem>
            <SettingItem label="Whitelist Rejection Message" htmlFor={rejectionMessage.eid} showOptional>
                <AutosizeTextarea
                    id={rejectionMessage.eid}
                    ref={rejectionMessageRef}
                    placeholder='Please join http://discord.gg/example and request to be whitelisted.'
                    defaultValue={rejectionMessage.initialValue}
                    onInput={processChanges}
                    autoComplete="off"
                    minHeight={60}
                    maxHeight={180}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Optional message to display to a player on the rejection message that shows when they try to connect while not being whitelisted. <br />
                    If you have a Discord whitelisting process, you can put here links to your guild.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Whitelisted Discord Roles" htmlFor={discordRoles.eid}>
                {/* FIXME: adicionar um warning se o whitelistMode não for guildRoles */}
                <Input
                    id={discordRoles.eid}
                    ref={discordRolesRef}
                    defaultValue={inputArrayUtil.toUi(discordRoles.initialValue)}
                    placeholder="000000000000000000, 000000000000000000"
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    The ID of the Discord roles that are whitelisted to join the server. <br />
                    This field supports multiple roles, separated by comma. <br />
                    <strong>Note:</strong> Requires the whitelist mode to be set to "Discord Guild Roles".
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
