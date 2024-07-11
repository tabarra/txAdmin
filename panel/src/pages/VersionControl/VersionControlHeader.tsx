import { HistoryIcon } from "lucide-react";

export default function VersionControlHeader() {
    return (
        <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-b">
            <div className="flex items-center space-x-2">
                <HistoryIcon className="mr-2 h-4 w-4" />
                <p className="font-mono text-sm">Version Control</p>
            </div>
        </div>
    )
}
