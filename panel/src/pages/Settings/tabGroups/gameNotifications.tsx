import TxAnchor from '@/components/TxAnchor'
import SwitchText from '@/components/SwitchText'
import InlineCode from '@/components/InlineCode'
import { SettingItem, SettingItemDesc } from '../settingsItems'


export function MainGroup() {
    return (<>
        <SettingItem label="Hide Admin Name In Punishments">
            <SwitchText
                id="hideAdminInPunishments"
                checkedLabel="Hidden"
                uncheckedLabel="Visible"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Never show to the players the admin name on <strong>Bans</strong> or <strong>Warns</strong>. <br />
                This information will still be available in the history and logs.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Hide Admin Name In Messages">
            <SwitchText
                id="hideAdminInMessages"
                checkedLabel="Hidden"
                uncheckedLabel="Visible"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Do not show the admin name on <strong>Announcements</strong> or <strong>DMs</strong>. <br />
                This information will still be available in the live console and logs.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Hide Announcement Notifications">
            <SwitchText
                id="hideDefaultAnnouncement"
                checkedLabel="Hidden"
                uncheckedLabel="Visible"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Suppresses the display of announcements, allowing you to implement your own announcement via the event <InlineCode>txAdmin:events:announcement</InlineCode>.
                <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Hide Direct Message Notification">
            <SwitchText
                id="hideDefaultDirectMessage"
                checkedLabel="Hidden"
                uncheckedLabel="Visible"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Suppresses the display of direct messages, allowing you to implement your own direct message notification via the event <InlineCode>txAdmin:events:playerDirectMessage</InlineCode>.
                <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Hide Warning Notification">
            <SwitchText
                id="hideDefaultWarning"
                checkedLabel="Hidden"
                uncheckedLabel="Visible"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Suppresses the display of warnings, allowing you to implement your own warning via the event <InlineCode>txAdmin:events:playerWarned</InlineCode>.
                <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Hide Scheduled Restart Warnings">
            <SwitchText
                id="hideScheduledRestartWarnings"
                checkedLabel="Hidden"
                uncheckedLabel="Visible"
                defaultChecked={false}
            />
            <SettingItemDesc>
                Suppresses the display of scheduled restart warnings, allowing you to implement your own warning via the event <InlineCode>txAdmin:events:scheduledRestart</InlineCode>.
                <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#settings-page-only">Documentation</TxAnchor>
            </SettingItemDesc>
        </SettingItem>
    </>)
}
