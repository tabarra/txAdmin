import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TxAnchor from '@/components/TxAnchor'
import { SettingItem, SettingItemDesc } from '../settingsItems'
import InlineCode from "@/components/InlineCode"


export function MainGroup() {
    return (<>
        {/* <SettingItem label="Test" required>
            <Input
                id="restartSchedule"
                placeholder="afds asd asdasd"
                type='email'
                onBlur={(e) => {
                    e.target.checkValidity()
                    console.log(e.target.checkValidity());
                    e.target.reportValidity()
                }}
                onChange={(e) => {
                    e.target.setCustomValidity('sdfdwsrf email')
                }}
                onFocus={(e) => {
                    //clear the invalid state
                    e.target.setCustomValidity('');
                    e.target.reportValidity()
                }}
                className='invalid:border-destructive'
            />
            <SettingItemDesc className='text-destructive-inline'>
                Invalid schedule format, please use 24-hour format with two digits for hours as well as minutes (<InlineCode>HH:MM</InlineCode>) and the times should be separated by commas.
            </SettingItemDesc>
            <SettingItemDesc>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </SettingItemDesc>
        </SettingItem> */}
        {/* <Input
            id="xxxxxx"
            required
            onChange={(e) => {
                if (!e.target.value.startsWith('aa')) {
                    e.target.setCustomValidity('Path must start with \'aa\'');
                } else {
                    e.target.setCustomValidity('');
                }
            }}
            className="invalid:dark:border-destructive invalid:dark:ring-destructive"
        /> */}
        <SettingItem label="Server Name" required>
            <Input id="serverName" placeholder="server name" required />
            <SettingItemDesc>
                A <strong>short</strong> server name to be used in the txAdmin interface and Server/Discord messages.
            </SettingItemDesc>
        </SettingItem>
        <SettingItem label="Language">
            <Select>
                <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="xxx">xxx</SelectItem>
                    <SelectItem value="yyy">yyy</SelectItem>
                </SelectContent>
            </Select>
            <SettingItemDesc>
                The language to use on Chat/Discord messages. <br />
                You can customize the phrases/words by using the <InlineCode>Custom</InlineCode> option. <br />
                For more information, please read the <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/translation.md" >documentation</TxAnchor>.
            </SettingItemDesc>
        </SettingItem>
    </>)
}
