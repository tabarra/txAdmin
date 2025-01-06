import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import TxAnchor from '@/components/TxAnchor'
import { PencilIcon } from 'lucide-react'
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'


export function MainGroup() {
    return (<>
        <SettingItem label="Discord Bot">
            <SwitchText
                id="discordEnabled"
                checkedLabel="Enabled"
                uncheckedLabel="Disabled"
                variant="checkedGreen"
            />
            <SettingItemDesc>
                Enable Discord Integration.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Token" htmlFor="discordToken" required>
            <Input
                id="discordToken"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                maxLength={96}
                autoComplete="off"
                className="blur-input"
                required
            />
            <SettingItemDesc>
                To get a token and the bot to join your server, follow these two guides:
                <TxAnchor href="https://discordjs.guide/preparations/setting-up-a-bot-application.html">Setting up a bot application</TxAnchor> and <TxAnchor href="https://discordjs.guide/preparations/adding-your-bot-to-servers.html">Adding your bot to servers</TxAnchor> <br />
                <strong>Note:</strong> Do not reuse the same token for another bot. <br />
                <strong>Note:</strong> The bot requires the <strong>Server Members</strong> intent, which can be set at the
                <TxAnchor href="https://discord.com/developers/applications">Discord Developer Portal</TxAnchor>.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Guild/Server ID" htmlFor="discordGuild">
            <Input id="discordGuild" placeholder="000000000000000000" required />
            <SettingItemDesc>
                The ID of the Discord Guild (also known as Discord Server). <br />
                To get the Guild ID, go to Discord's settings and
                <TxAnchor href="https://support.discordapp.com/hc/article_attachments/115002742731/mceclip0.png"> enable developer mode</TxAnchor>, then right-click on the guild icon select "Copy ID".
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Warnings Channel ID" htmlFor="announceChannel" showOptional>
            <Input id="announceChannel" placeholder="000000000000000000" />
            <SettingItemDesc>
                The ID of the channel to send Announcements (eg server restarts). <br />
                You can leave it blank to disable this feature. <br />
                To get the channel ID, go to Discord's settings and
                <TxAnchor href="https://support.discordapp.com/hc/article_attachments/115002742731/mceclip0.png"> enable developer mode</TxAnchor>, then right-click on the channel name and select "Copy ID".
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Status Embed">
            <div className="flex flex-wrap gap-6">
                <Button
                    size={'sm'}
                    variant="secondary"
                >
                    <PencilIcon className='size-4 mr-1.5 inline-block' /> Change Embed JSON
                </Button>
                <Button
                    size={'sm'}
                    variant="secondary"
                >
                    <PencilIcon className='size-4 mr-1.5 inline-block' /> Change Config JSON
                </Button>
            </div>
            <SettingItemDesc>
                The server status embed is customizable by editing the two JSONs above. <br />
                <strong>Note:</strong> Use the command <InlineCode>/status add</InlineCode> on a channel that the bot has the "Send Message" permission to setup the embed.
            </SettingItemDesc>
        </SettingItem>
    </>)
}
