import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'
import { PencilIcon } from 'lucide-react'
import SwitchText from '@/components/SwitchText'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { AutosizeTextarea } from "@/components/ui/autosize-textarea"


export function MainGroup() {
    return (<>
        <SettingItem label="Ban Checking">
            <SwitchText
                id="onJoinCheckBan"
                checkedLabel="Enabled"
                uncheckedLabel="Disabled"
                variant={'redGreen'}
                defaultChecked={true}
            />
            <SettingItemDesc>
                Enable checking for ban status on player join. <br />
                <strong>Note:</strong> txAdmin bans will not work if this option is disabled.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Ban Templates">
            <Link asChild href="/settings/ban-templates">
                <Button
                    size={'sm'}
                    variant="secondary"
                >
                    <PencilIcon className='size-4 mr-1.5 inline-block' /> Edit Ban Templates
                </Button>
            </Link>
            <SettingItemDesc>
                Configure ban reasons and durations that will appear as dropdown options when banning a player. This is useful for common reasons that happen frequently, like violation of your server rules.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Ban Rejection Message" htmlFor="banRejectionMessage" showOptional>
            <AutosizeTextarea
                id="banRejectionMessage"
                placeholder='You can join http://discord.gg/example to appeal this ban.'
                autoComplete="off"
                minHeight={60}
                maxHeight={180}
            />
            <SettingItemDesc>
                Optional message to display to a player on the rejection message that shows when they try to connect while being banned. <br />
                If you have a ban appeal process, you can use this field to inform the players.
            </SettingItemDesc>
        </SettingItem>
    </>)
}

export function AdvancedGroup() {
    return (<>
        <SettingItem label="Required Ban HWID Matches">
            <Select defaultValue='1'>
                <SelectTrigger id="requiredBanHWIDMatches">
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1 - recommended</SelectItem>
                    <SelectItem value="2">2 - lax</SelectItem>
                    <SelectItem value="3">3 - very lax</SelectItem>
                    <SelectItem value="4">4 - virtually disabled</SelectItem>
                    <SelectItem value="0">Disable HWID Bans</SelectItem>
                </SelectContent>
            </Select>
            <SettingItemDesc>
                This option configures how many HWID tokens must match between a player and an existing ban for the player join to be blocked, or can disable HWID Bans entirely. <br />
                Since Hardware ID Tokens are not guaranteed to be unique, there is the possibility of tokens from two players matching without them being related to each other. <br />
                <strong>Note:</strong> Most players have 3 to 6 HWID tokens.
            </SettingItemDesc>
        </SettingItem>
    </>)
}
