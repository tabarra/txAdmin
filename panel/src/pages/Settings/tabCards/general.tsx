import { Input } from "@/components/ui/input"
import { SettingItem, SettingItemDesc } from '../settingsItems'
import { processConfigStates, SettingsCardProps, useConfAccessor } from "../utils"
import { useEffect, useMemo, useRef } from "react"
import SettingsCardShell from "../SettingsCardShell"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import InlineCode from "@/components/InlineCode"
import TxAnchor from "@/components/TxAnchor"
import { txToast } from "@/components/TxToaster"


const detectBrowserLanguage = () => {
    const txTopLocale = Array.isArray(window.txBrowserLocale)
        ? window.txBrowserLocale[0]
        : window.txBrowserLocale;
    try {
        return new Intl.Locale(txTopLocale).language
    } catch (error) { }
    try {
        if (txTopLocale.includes('-')) {
            return txTopLocale.split('-')[0];
        }
    } catch (error) { }
    return undefined;
}


export default function ConfigCardGeneral({ cardCtx, pageCtx }: SettingsCardProps) {
    //Small QOL to hoist the detected browser language to the top of the list
    const localeData = useMemo(() => {
        if (!pageCtx.apiData?.locales) return null;
        const browserLanguage = detectBrowserLanguage();
        let enData;
        let browserData;
        let otherData = [];
        for (const lang of pageCtx.apiData?.locales) {
            if (lang.code === 'en') {
                enData = lang;
            } else if (lang.code === browserLanguage) {
                browserData = {
                    code: lang.code,
                    label: `${lang.label} (browser)`
                };
            } else {
                otherData.push(lang);
            }
        }
        return [
            enData,
            browserData,
            'sep1',
            ...otherData,
            'sep2',
            { code: 'custom', label: 'Custom (txData/locale.json)' }
        ].filter(Boolean);
    }, [pageCtx.apiData]);

    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);
    const serverName = conf('general', 'serverName');
    const serverNameRef = useRef<HTMLInputElement | null>(null);
    const language = conf('general', 'language');

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
            [serverName, serverNameRef.current?.value],
            [language, language.state.value],
        ]);
        pageCtx.setCardPendingSave(res.hasChanges ? cardCtx : null);
        return res;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
        if (!hasChanges) return;

        if (!localConfigs.general?.serverName) {
            return txToast.error('The Server Name is required.');
        }
        if (localConfigs.general?.serverName?.length > 18) {
            return txToast.error('The Server Name is too big.');
        }
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        language.state.value,
    ]);

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
        >
            <SettingItem label="Server Name" htmlFor={serverName.eid} required>
                <Input
                    id={serverName.eid}
                    ref={serverNameRef}
                    defaultValue={serverName.initialValue}
                    placeholder={'Example RP'}
                    onChange={processChanges}
                    disabled={pageCtx.isReadOnly}
                />
                <SettingItemDesc>
                    A <strong>short</strong> server name to be used in the txAdmin interface and Server/Discord messages. <br />
                    The name must be between 1 and 18 characters.
                </SettingItemDesc>
            </SettingItem>
            <SettingItem label="Language" htmlFor={language.eid} required>
                {/* TODO: add a "Edit xxx" button besides the language for easy custom.json locale */}
                <Select
                    value={language.state.value}
                    onValueChange={language.state.set as any}
                    disabled={pageCtx.isReadOnly}
                >
                    <SelectTrigger id={language.eid}>
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {localeData?.map((locale) => (
                            typeof locale === 'object'
                                ? <SelectItem key={locale.code} value={locale.code}>{locale.label}</SelectItem>
                                : <SelectSeparator key={locale} />
                        ))}
                    </SelectContent>
                </Select>
                <SettingItemDesc>
                    The language to use on Chat/Discord messages. <br />
                    You can customize the phrases/words by using the <InlineCode>Custom</InlineCode> option. <br />
                    For more information, please read the <TxAnchor href="https://github.com/tabarra/txAdmin/blob/master/docs/translation.md">documentation</TxAnchor>.
                </SettingItemDesc>
            </SettingItem>
        </SettingsCardShell>
    )
}
