import type { SettingTabsDatum } from './SettingsPage'
import type { SettingsPageContext } from './utils'


type SettingsTabProps = {
    tab: SettingTabsDatum;
    pageCtx: SettingsPageContext;
};

export default function SettingsTab({ tab, pageCtx }: SettingsTabProps) {
    if ('cards' in tab) {
        return (
            <div id={`tab-${tab.ctx.tabId}`} className='space-y-4'>
                {tab.cards.map(({ ctx, Component }) => (
                    <Component
                        key={ctx.cardId}
                        pageCtx={pageCtx}
                        cardCtx={ctx}
                    />
                ))}
            </div>
        )
    } else {
        return (
            <tab.Component
                key={tab.ctx.tabId}
                pageCtx={pageCtx}
                cardCtx={tab.ctx}
            />
        )
    }
};
