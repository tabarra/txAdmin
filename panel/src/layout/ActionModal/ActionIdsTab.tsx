import type { DatabaseActionType } from "../../../../core/modules/Database/databaseTypes";
import MultiIdsList from "@/components/MultiIdsList";


export default function ActionIdsTab({ action }: { action: DatabaseActionType }) {
    return <div className="flex flex-col gap-4 px-1 mb-1 md:mb-4">
        <MultiIdsList
            type='id'
            src='action'
            list={action.ids}
        />
        <MultiIdsList
            type='hwid'
            src='action'
            list={('hwids' in action && action.hwids) ? action.hwids : []}
        />
    </div>;
}
