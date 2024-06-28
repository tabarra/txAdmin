import { useMemo } from "react";
import { cn, numberToLocaleString } from "@/lib/utils";
import { PlayerDropsMessage } from "./PlayerDropsGenericSubcards";
import type { PDLChangeEventType } from "@shared/otherTypes";


function DiffOld({ children }: { children: React.ReactNode }) {
    return (
        <span className="font-mono px-1 text-sm text-primary dark:text-background bg-destructive-inline">
            {children}
        </span>
    );
}
function DiffNew({ children }: { children: React.ReactNode }) {
    return (
        <span className="font-mono px-1 text-sm text-primary dark:text-background bg-success-inline">
            {children}
        </span>
    );
}

type DrilldownChangesSubcardProps = {
    changes: PDLChangeEventType[];
};

export default function DrilldownChangesSubcard({ changes }: DrilldownChangesSubcardProps) {
    changes = [
        {
            type: 'fxsChanged',
            oldVersion: 'xxxx',
            newVersion: '7999',
            ts: 192837465000,
        },
        {
            type: 'gameChanged',
            oldVersion: 'gta5:xxx',
            newVersion: 'gta5:2060',
            ts: 192837465000,
        },
        {
            type: 'resourcesChanged',
            resAdded: ['aaaaa', 'bbbbb', 'ccccc'],
            resRemoved: ['xxxx', 'yyyyy', 'zzzzzz'],
            ts: 192837465000,
        }
    ]

    if (!changes.length) {
        return <PlayerDropsMessage message="No environmental changes within this time window." />;
    }

    return (
        <div className="px-4 pt-2 space-y-4">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">
                    June 14, 2024
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold">Changed FXServer Version</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Switched from <DiffOld>7999</DiffOld> to <DiffNew>8509</DiffNew>.
                    </p>
                </div>
            </div>

            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">
                    June 14, 2024
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold">Changed Game Version</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Switched from <DiffOld>gta5:2060</DiffOld> to <DiffNew>gta5:3095</DiffNew>.
                    </p>
                </div>
            </div>

            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">May 22, 2024</div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold">
                        Changed boot resources
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Removed: <DiffOld>xxxx</DiffOld>, <DiffOld>yyyyy</DiffOld>, <DiffOld>zzzzzz</DiffOld>. <br />
                        Added: <DiffNew>aaaaa</DiffNew>, <DiffNew>bbbbb</DiffNew>, <DiffNew>ccccc</DiffNew>.
                    </p>
                </div>
            </div>
        </div>
    );
}
