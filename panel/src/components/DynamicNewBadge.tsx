import React from "react";

/**
 * Types
 */
type DynamicNewItemProps = {
    featName: string;
    durationDays?: number; //3d default
    children: React.ReactNode;
};

type DynamicNewBadgeProps = {
    featName: string;
    durationDays?: number; //3d default
    badgeText?: string;
};


/**
 * A dynamic component that shows its children for the first X days.
 * NOTE: always on for dev mode to make sure I doesn't forget to remove it.
 */
function DynamicNewItemInner({ featName, durationDays, children }: DynamicNewItemProps) {
    const storageKeyName = `dynamicNewFeatTs-${featName}`;
    const storedTs = parseInt(localStorage.getItem(storageKeyName) ?? '');
    if (isNaN(storedTs) || window.txConsts.showAdvanced) {
        localStorage.setItem(storageKeyName, Date.now().toString());
    } else {
        const badgeDuration = (durationDays ?? 3) * 24 * 60 * 60 * 1000;

        if (storedTs + badgeDuration < Date.now()) {
            return null;
        }
    }

    return children;
}

export const DynamicNewItem = React.memo(DynamicNewItemInner);


/**
 * A dynamic badge that shows "NEW" for the first X days.
 */
function DynamicNewBadgeInner({ badgeText, featName, durationDays }: DynamicNewBadgeProps): JSX.Element {
    return (
        <DynamicNewItemInner featName={featName} durationDays={durationDays}>
            <span className='rounded bg-accent text-accent-foreground text-2xs tracking-wider font-semibold px-1 ml-1.5'>
                {badgeText ?? 'NEW'}
            </span>
        </DynamicNewItemInner>
    );
}

export const DynamicNewBadge = React.memo(DynamicNewBadgeInner);
