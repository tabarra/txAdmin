import React from "react";

type DynamicNewBadgeProps = {
    featName: string;
    durationDays?: number; //3d default
};

/**
 * A dynamic badge that shows "NEW" for the first X days.
 * NOTE: always on for dev mode to make sure I doesn't forget to remove it.
 */
function DynamicNewBadge({ featName, durationDays }: DynamicNewBadgeProps) {
    const storageKeyName = `dynamicNewBadgeTs-${featName}`;
    const storedTs = parseInt(localStorage.getItem(storageKeyName) ?? '');
    if (isNaN(storedTs) || window.txConsts.showAdvanced) {
        localStorage.setItem(storageKeyName, Date.now().toString());
    } else {
        const badgeDuration = (durationDays ?? 3) * 24 * 60 * 60 * 1000;

        if (storedTs + badgeDuration < Date.now()) {
            return null;
        }
    }

    //bg-accent or bg-success?
    return (
        <span className='rounded bg-accent text-accent-foreground text-2xs tracking-wider font-semibold px-1 ml-1.5'>NEW</span>
    );
}

export default React.memo(DynamicNewBadge);
