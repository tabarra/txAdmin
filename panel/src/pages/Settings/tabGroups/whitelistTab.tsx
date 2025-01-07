import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import TxAnchor from '@/components/TxAnchor'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { RadioGroup } from "@/components/ui/radio-group"
import BigRadioItem from "@/components/BigRadioItem"
import { useState } from "react"
import { AutosizeTextarea } from "@/components/ui/autosize-textarea"



export function MainGroup() {
    const [whitelistMode, setWhitelistMode] = useState('disabled');

    // FIXME: adicionar um warning no whitelistedDiscordRoles se o whitelistMode não for guildRoles

    return (<>
        <SettingItem label="Whitelist Mode">
            <RadioGroup defaultValue={whitelistMode} onValueChange={setWhitelistMode}>
                <BigRadioItem
                    groupValue={whitelistMode}
                    value="disabled"
                    title="Disabled"
                    desc="No whitelist status will be checked by txAdmin."
                />
                <BigRadioItem
                    groupValue={whitelistMode}
                    value="adminOnly"
                    title="Admin-only (maintenance mode)"
                    desc={(<>
                        Will only allow server join if your <InlineCode>fivem:</InlineCode> or <InlineCode>discord:</InlineCode> identifiers are attached to a txAdmin administrator. Also known as maintenance mode.
                    </>)}
                />
                <BigRadioItem
                    groupValue={whitelistMode}
                    value="guildMember"
                    title="Discord Guild Member"
                    desc={(<>
                        Checks if the player joining has a <InlineCode>discord:</InlineCode> identifier and is present in the Discord guild configured in the Discord Tab.
                    </>)}
                />
                <BigRadioItem
                    groupValue={whitelistMode}
                    value="guildRoles"
                    title="Discord Guild Roles"
                    desc={(<>
                        Checks if the player joining has a <InlineCode>discord:</InlineCode> identifier and is present in the Discord guild configured in the Discord Tab and has at least one of the roles specified below.
                    </>)}
                />
                <BigRadioItem
                    groupValue={whitelistMode}
                    value="approvedLicense"
                    title="Approved License"
                    desc={(<>
                        The player <InlineCode>license:</InlineCode> identifier must be whitelisted by a txAdmin administrator. This can be done through the <TxAnchor href="/whitelist">Whitelist page</TxAnchor>, or the <InlineCode>/whitelist</InlineCode> Discord bot slash command.
                    </>)}
                />
            </RadioGroup>
        </SettingItem>
        <SettingItem label="Whitelist Rejection Message" htmlFor="whitelistRejectionMessage" showOptional>
            <AutosizeTextarea
                id="whitelistRejectionMessage"
                placeholder='Please join http://discord.gg/example and request to be whitelisted.'
                autoComplete="off"
                minHeight={60}
                maxHeight={180}
            />
            <SettingItemDesc>
                Optional message to display to a player on the rejection message that shows when they try to connect while not being whitelisted. <br />
                If you have a Discord whitelisting process, you can put here links to your guild.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Whitelisted Discord Roles" htmlFor="whitelistedDiscordRoles">
            <Input id="whitelistedDiscordRoles" placeholder="000000000000000000, 000000000000000000" />
            <SettingItemDesc>
                The ID of the Discord roles that are whitelisted to join the server. <br />
                This field supports multiple roles, separated by comma. <br />
                <strong>Note:</strong> Requires the whitelist mode to be set to "Discord Guild Roles".
            </SettingItemDesc>
        </SettingItem>
    </>)
}
