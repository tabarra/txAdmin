import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import TxAnchor from '@/components/TxAnchor'
import { RotateCcwIcon, XIcon } from 'lucide-react'
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { useEffect, useRef } from "react"
import SettingsCardShell from "../SettingsCardShell"
import { SettingsCardProps, useConfAccessor, processConfigStates } from "../utils"
import { Textarea } from "@/components/ui/textarea"
import { txToast } from "@/components/TxToaster"


//We are not validating the JSON, only that it is a string
export const attemptBeautifyJsonString = (input: string) => {
    try {
        return JSON.stringify(JSON.parse(input), null, 4);
    } catch (error) {
        return input;
    }
};


export default function ConfigCardDiscord({ cardCtx, pageCtx }: SettingsCardProps) {
    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const botEnabled = conf('discordBot', 'enabled');
    const botToken = conf('discordBot', 'token');
    const botTokenRef = useRef<HTMLInputElement | null>(null);
    const discordGuild = conf('discordBot', 'guild');
    const discordGuildRef = useRef<HTMLInputElement | null>(null);
    const warningsChannel = conf('discordBot', 'warningsChannel');
    const warningsChannelRef = useRef<HTMLInputElement | null>(null);
    const embedJson = conf('discordBot', 'embedJson');
    const embedConfigJson = conf('discordBot', 'embedConfigJson');

    //Marshalling Utils
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

        const res = processConfigStates([
            [botEnabled, botEnabled.state.value],
            [botToken, emptyToNull(botTokenRef.current?.value)],
            [discordGuild, emptyToNull(discordGuildRef.current?.value)],
            [warningsChannel, emptyToNull(warningsChannelRef.current?.value)],
            [embedJson, embedJson.state.value],
            [embedConfigJson, embedConfigJson.state.value],
        ]);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
        if (!hasChanges) return;

        if (localConfigs.discordBot?.enabled) {
            if (!localConfigs.discordBot?.token) {
                return txToast.error('You must provide a Discord Bot Token to enable the bot.');
            }
            if (!localConfigs.discordBot?.guild) {
                return txToast.error('You must provide a Server ID to enable the bot.');
            }
            if (!localConfigs.discordBot?.embedJson || !localConfigs.discordBot?.embedConfigJson) {
                return txToast.error('You must provide both the Embed JSON and Config JSON to enable the bot.');
            }
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        botEnabled.state.value,
        embedJson.state.value,
        embedConfigJson.state.value,
    ]);

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="Discord Bot">
                <SwitchText
                    id={botEnabled.eid}
                    checkedLabel="Enabled"
                    uncheckedLabel="Disabled"
                    variant="checkedGreen"
                    checked={botEnabled.state.value}
                    onCheckedChange={botEnabled.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Enable Discord Integration.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Token" htmlFor={botToken.eid} required={botEnabled.state.value}>
                <Input
                    id={botToken.eid}
                    ref={botTokenRef}
                    defaultValue={botToken.initialValue}
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
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
            <SettingItem label="Guild/Server ID" htmlFor={discordGuild.eid} required={botEnabled.state.value}>
                <Input
                    id={discordGuild.eid}
                    ref={discordGuildRef}
                    defaultValue={discordGuild.initialValue}
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                    placeholder='000000000000000000'
                />
                <SettingItemDesc>
                    The ID of the Discord Server (also known as Discord Guild). <br />
                    To get the Server ID, go to Discord's settings and
                    <TxAnchor href="https://support.discordapp.com/hc/article_attachments/115002742731/mceclip0.png"> enable developer mode</TxAnchor>, then right-click on the guild icon select "Copy ID".
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Warnings Channel ID" htmlFor={warningsChannel.eid} showOptional>
                <Input
                    id={warningsChannel.eid}
                    ref={warningsChannelRef}
                    defaultValue={warningsChannel.initialValue}
                    onInput={processChanges}
                    disabled={pageCtx.isReadOnly}
                    placeholder='000000000000000000'
                />
                <SettingItemDesc>
                    The ID of the channel to send Announcements (eg server restarts). <br />
                    You can leave it blank to disable this feature. <br />
                    To get the channel ID, go to Discord's settings and
                    <TxAnchor href="https://support.discordapp.com/hc/article_attachments/115002742731/mceclip0.png"> enable developer mode</TxAnchor>, then right-click on the channel name and select "Copy ID".
                </SettingItemDesc>
            </SettingItem>
            {/* <SettingItem label="Status Embed">
                <div className="flex flex-wrap gap-6">
                    <Button
                        size={'sm'}
                        variant="secondary"
                        disabled={pageCtx.isReadOnly}
                        // FIXME: implement
                    >
                        <PencilIcon className='size-4 mr-1.5 inline-block' /> Change Embed JSON
                    </Button>
                    <Button
                        size={'sm'}
                        variant="secondary"
                        disabled={pageCtx.isReadOnly}
                        // FIXME: implement
                    >
                        <PencilIcon className='size-4 mr-1.5 inline-block' /> Change Config JSON
                    </Button>
                </div>
                <SettingItemDesc>
                    The server status embed is customizable by editing the two JSONs above. <br />
                    <strong>Note:</strong> Use the command <InlineCode>/status add</InlineCode> on a channel that the bot has the "Send Message" permission to setup the embed.
                </SettingItemDesc>
            </SettingItem> */}
            <SettingItem label="Status Embed JSON" htmlFor={embedJson.eid} required={botEnabled.state.value}>
                <div className="flex flex-col gap-2">
                    <Textarea
                        id={embedJson.eid}
                        placeholder='{}'
                        value={attemptBeautifyJsonString(embedJson.state.value ?? '')}
                        onChange={(e) => embedJson.state.set(e.target.value)}
                        autoComplete="off"
                        style={{ minHeight: 512 }}
                        disabled={pageCtx.isReadOnly}
                        spellCheck={false}
                    />
                    <div className="w-full flex flex-wrap justify-between gap-6">
                        <Button
                            className="grow"
                            variant="outline"
                            onClick={() => embedJson.state.discard()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <XIcon className="mr-2 h-4 w-4" /> Discard Changes
                        </Button>
                        <Button
                            className="grow border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            variant="outline"
                            onClick={() => embedJson.state.default()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <RotateCcwIcon className="mr-2 h-4 w-4" /> Reset to Default
                        </Button>
                    </div>
                </div>
                <SettingItemDesc>
                    The server status embed is customizable by editing the JSON above. <br />
                    <strong>Note:</strong> Use the command <InlineCode>/status add</InlineCode> on a channel that the bot has the "Send Message" permission to setup the embed.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Status Config JSON" htmlFor={embedConfigJson.eid} required={botEnabled.state.value}>
                <div className="flex flex-col gap-2">
                    <Textarea
                        id={embedConfigJson.eid}
                        placeholder='{}'
                        value={attemptBeautifyJsonString(embedConfigJson.state.value ?? '')}
                        onChange={(e) => embedConfigJson.state.set(e.target.value)}
                        autoComplete="off"
                        style={{ minHeight: 512 }}
                        disabled={pageCtx.isReadOnly}
                        spellCheck={false}
                    />
                    <div className="w-full flex flex-wrap justify-between gap-6">
                        <Button
                            className="grow"
                            variant="outline"
                            onClick={() => embedConfigJson.state.discard()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <XIcon className="mr-2 h-4 w-4" /> Discard Changes
                        </Button>
                        <Button
                            className="grow border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            variant="outline"
                            onClick={() => embedConfigJson.state.default()}
                            disabled={pageCtx.isReadOnly}
                        >
                            <RotateCcwIcon className="mr-2 h-4 w-4" /> Reset to Default
                        </Button>
                    </div>
                </div>
                <SettingItemDesc>
                    The server status embed is customizable by editing the JSON above. <br />
                    <strong>Note:</strong> Use the command <InlineCode>/status add</InlineCode> on a channel that the bot has the "Send Message" permission to setup the embed.
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
