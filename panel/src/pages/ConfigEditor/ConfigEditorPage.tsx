import { PageHeader } from "@/components/page-header";
import { txToast } from "@/components/TxToaster";
import { useBackendApi } from "@/hooks/fetch";
import type { GetConfigFileResp } from "@shared/otherTypes";
import { FileEditIcon } from "lucide-react";
import { useRef, useState } from "react";
import useSWR from "swr";
import ConfigEditorHeader from "./ConfigEditorHeader";
import ConfigFileEditor from "./ConfigFileEditor";
import CardContentOverlay from "@/components/CardContentOverlay";
import type { editor } from 'monaco-editor'; //peer dependency


export default function ConfigEditorPage() {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const getFileApi = useBackendApi<GetConfigFileResp>({
        method: 'GET',
        path: `/configEditor/getFile`,
        throwGenericErrors: true,
    });
    const saveFileApi = useBackendApi<unknown>({
        method: 'POST',
        path: `/configEditor/saveFile`,
        throwGenericErrors: true,
    });

    const swr = useSWR('/settings/configs', async () => {
        const data = await getFileApi({});
        if (!data) throw new Error('No data returned');
        if ('error' in data) throw new Error(data.error);
        return data;
    }, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    //Handlers
    const saveChanges = async () => {
        if (isSaving) return;
        const toastId = txToast.loading(`Saving changes...`, { id: 'configFileSaving' });
        setIsSaving(true);
        try {
            if (!swr.data) throw new Error('Cannot save changes without swr.data.');
            const saveResp = await saveFileApi({
                data: { /* FIXME:NC  */ },
                toastId,
            });
            if (!saveResp) throw new Error('empty_response');
            // if (saveResp.type === 'error') return; //the fetcher will handle the error
            // if (!saveResp.xxxxx) throw new Error('xxxxx');
            /* FIXME:NC  */
            swr.mutate({
                ...swr.data,
                /* FIXME:NC  */
            }, false);
        } catch (error) {
            txToast.error({
                title: `Error saving changes:`,
                msg: (error as any).message,
            }, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    }

    const handleResetChanges = () => {
        txToast.info('Resetting changes...');
    };

    const handleSaveChanges = () => {
        if(!editorRef.current) return;
        txToast.warning(editorRef.current?.getValue() ?? 'adsfsdf');
    };

    return (
        <div className="w-full h-full flex flex-col max-h-contentvh">
            <PageHeader title="Config Editor" icon={<FileEditIcon />} />
            <div className="grow px-0 xs:px-3 md:px-0 w-full h-32">
                <div className="flex flex-col gap-2 h-full">
                    <ConfigEditorHeader
                        filePath={swr.data?.isConfigured ? swr.data.filePath : undefined}
                        isConfigured={!!(swr.data && ('isConfigured' in swr.data) && swr.data.isConfigured)}
                        isSaving={isSaving}
                        onResetChanges={handleResetChanges}
                        onSaveChanges={handleSaveChanges}
                    />

                    {/* Main Content */}
                    <div className="relative flex-1 flex xs:rounded-lg overflow-hidden border">
                        <CardContentOverlay
                            loading={swr.isLoading}
                            error={swr.error?.message}
                            message={!swr.data?.isConfigured ? (
                                <p>
                                    Your server is not yet configured. <br />
                                    Please go to the setup page and configure it.
                                </p>
                            ) : undefined}
                        />
                        <ConfigFileEditor
                            editorRef={editorRef}
                            fileData={swr.data?.isConfigured ? swr.data.fileData : undefined}
                            onSaveChanges={handleSaveChanges}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
