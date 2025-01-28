import TxAnchor from '@/components/TxAnchor';
import SwitchText from '@/components/SwitchText';
import InlineCode from '@/components/InlineCode';
import { SettingItem, SettingItemDesc } from '../settingsItems';
import { useEffect, useState } from 'react';
import { diffConfig, SettingsCardProps, useConfAccessor } from '../utils';
import SettingsCardShell from '../SettingsCardShell';

export default function ConfigCardGameNotifications({ cardCtx, pageCtx }: SettingsCardProps) {
    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const hideAdminInPunishments = conf('gameFeatures', 'hideAdminInPunishments');
    const hideAdminInMessages = conf('gameFeatures', 'hideAdminInMessages');
    const hideDefaultAnnouncement = conf('gameFeatures', 'hideDefaultAnnouncement');
    const hideDefaultDirectMessage = conf('gameFeatures', 'hideDefaultDirectMessage');
    const hideDefaultWarning = conf('gameFeatures', 'hideDefaultWarning');
    const hideScheduledRestartWarnings = conf('gameFeatures', 'hideDefaultScheduledRestartWarning');

    //Check against stored value and sets the page state
    const processChanges = () => {
        if (!pageCtx.apiData) return;

        const diff = diffConfig([
            [hideAdminInPunishments, hideAdminInPunishments.state.value],
            [hideAdminInMessages, hideAdminInMessages.state.value],
            [hideDefaultAnnouncement, hideDefaultAnnouncement.state.value],
            [hideDefaultDirectMessage, hideDefaultDirectMessage.state.value],
            [hideDefaultWarning, hideDefaultWarning.state.value],
            [hideScheduledRestartWarnings, hideScheduledRestartWarnings.state.value],
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
        hideAdminInPunishments.state.value,
        hideAdminInMessages.state.value,
        hideDefaultAnnouncement.state.value,
        hideDefaultDirectMessage.state.value,
        hideDefaultWarning.state.value,
        hideScheduledRestartWarnings.state.value,
    ]);

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="Hide Admin Name In Punishments">
                <SwitchText
                    id={hideAdminInPunishments.eid}
                    checkedLabel="Hidden"
                    uncheckedLabel="Visible"
                    checked={hideAdminInPunishments.state.value}
                    onCheckedChange={hideAdminInPunishments.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Never show to the players the admin name on <strong>Bans</strong> or <strong>Warns</strong>. <br />
                    This information will still be available in the history and logs.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Hide Admin Name In Messages">
                <SwitchText
                    id={hideAdminInMessages.eid}
                    checkedLabel="Hidden"
                    uncheckedLabel="Visible"
                    checked={hideAdminInMessages.state.value}
                    onCheckedChange={hideAdminInMessages.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Do not show the admin name on <strong>Announcements</strong> or <strong>DMs</strong>. <br />
                    This information will still be available in the live console and logs.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Hide Announcement Notifications">
                <SwitchText
                    id={hideDefaultAnnouncement.eid}
                    checkedLabel="Hidden"
                    uncheckedLabel="Visible"
                    checked={hideDefaultAnnouncement.state.value}
                    onCheckedChange={hideDefaultAnnouncement.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Suppresses the display of announcements, allowing you to implement your own announcement via the event <InlineCode>txAdmin:events:announcement</InlineCode>.
                    <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Hide Direct Message Notification">
                <SwitchText
                    id={hideDefaultDirectMessage.eid}
                    checkedLabel="Hidden"
                    uncheckedLabel="Visible"
                    checked={hideDefaultDirectMessage.state.value}
                    onCheckedChange={hideDefaultDirectMessage.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Suppresses the display of direct messages, allowing you to implement your own direct message notification via the event <InlineCode>txAdmin:events:playerDirectMessage</InlineCode>.
                    <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Hide Warning Notification">
                <SwitchText
                    id={hideDefaultWarning.eid}
                    checkedLabel="Hidden"
                    uncheckedLabel="Visible"
                    checked={hideDefaultWarning.state.value}
                    onCheckedChange={hideDefaultWarning.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Suppresses the display of warnings, allowing you to implement your own warning via the event <InlineCode>txAdmin:events:playerWarned</InlineCode>.
                    <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Hide Scheduled Restart Warnings">
                <SwitchText
                    id={hideScheduledRestartWarnings.eid}
                    checkedLabel="Hidden"
                    uncheckedLabel="Visible"
                    checked={hideScheduledRestartWarnings.state.value}
                    onCheckedChange={hideScheduledRestartWarnings.state.set}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    Suppresses the display of scheduled restart warnings, allowing you to implement your own warning via the event <InlineCode>txAdmin:events:scheduledRestart</InlineCode>.
                    <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
