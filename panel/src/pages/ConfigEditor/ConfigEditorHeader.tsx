import { Button } from "@/components/ui/button";
import type { GetConfigFileResp } from "@shared/otherTypes";
import { Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react";

type ConfigEditorHeaderProps = {
    filePath?: string;
    isConfigured: boolean;
    isSaving: boolean;
    onResetChanges: () => void;
    onSaveChanges: () => void;
};

export default function ConfigEditorHeader({ filePath, isConfigured, isSaving, onResetChanges, onSaveChanges }: ConfigEditorHeaderProps) {
    // const [tab, setTab] = useState('server-cfg');
    let filePathNode = <span className="italic">loading...</span>;
    if (filePath) {
        filePathNode = <code className="text-muted-foreground">{filePath}</code>;
    } else if (!isConfigured) {
        filePathNode = <span className="italic">not configured</span>;
    }
    return (
        <div className="py-2 flex flex-wrap gap-4">
            <div className="flex-1 shrink-0">
                {/* <Tabs value={tab} onValueChange={setTab}>
                    <TabsList
                        className="max-xs:sticky max-xs:top-navbarvh z-10 flex-wrap h-[unset] max-xs:w-full max-xs:rounded-none"
                    >
                        <TabsTrigger value='server-cfg' className="hover:text-primary">
                            server.cfg
                        </TabsTrigger>
                        <TabsTrigger value='server-listing' className="hover:text-primary">
                            Server Listing
                        </TabsTrigger>
                        <TabsTrigger value='database' className="hover:text-primary">
                            Database
                        </TabsTrigger>
                        <TabsTrigger value='permissions' className="hover:text-primary">
                            Permissions
                        </TabsTrigger>
                    </TabsList>
                </Tabs> */}
                <h3 className="text-lg leading-loose">
                    <strong>Editing:</strong> <code className="text-muted-foreground">{filePathNode}</code>
                </h3>

            </div>
            <div className="flex justify-end items-end gap-2">
                {/* <button
                    className="flex max-w-minx items-center gap-2 text-left border border-warning p-2 rounded-lg text-warning"
                    onClick={() => {
                        // TODO: Implement toggle for errors panel
                    }}
                >
                    <span className="">3 issues detected</span>
                    <ChevronDownIcon className="h-4" />
                </button> */}
                <Button
                    variant="outline"
                    onClick={onResetChanges}
                    disabled={!isConfigured || isSaving}
                    className="group"
                >
                    {filePath === undefined || !isConfigured || isSaving ? (
                        <Loader2Icon className="inline mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcwIcon className="inline mr-2 h-4 w-4" />
                    )} Reset Changes
                </Button>
                <Button
                    onClick={onSaveChanges}
                    disabled={!isConfigured || isSaving}
                    className="group"
                >
                    {filePath === undefined || !isConfigured || isSaving ? (
                        <Loader2Icon className="inline mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <SaveIcon className="inline mr-2 h-4 w-4" />
                    )} Save Changes
                </Button>
            </div>
        </div>
    );
}
