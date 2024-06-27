import { Button } from "@/components/ui/button";
import { txToast } from "@/components/TxToaster";
import { BackendApiError, useBackendApi } from "@/hooks/fetch";
import { ApiToastResp } from "@shared/genericApiTypes";




export default function TmpApi() {
    type FxsControlReqType = {
        action: 'start' | 'stop' | 'restart';
    }
    const fxsControlApi = useBackendApi<ApiToastResp, FxsControlReqType>({
        method: 'POST',
        path: '/fxserver/controls',
        abortOnUnmount: true
    });

    const testSimpleToast = () => {
        fxsControlApi({
            data: { action: 'start' },
            queryParams: { delay: 5 },
            toastLoadingMessage: 'Starting...',
        });
    }
    const testTypedPromise = async () => {
        try {
            const resp = await fxsControlApi({
                data: { action: 'restart' },
            });
            alert(`Success:\n${JSON.stringify(resp)}`);
        } catch (error) {
            if (error instanceof BackendApiError) {
                alert(`Error: ${error.title}: ${error.message}`);
            } else {
                alert(`Error: ${JSON.stringify(error)}`);
            }
        }
    }
    const testTypedCallback = () => {
        const toastId = txToast.loading('Starting...');
        fxsControlApi({
            data: { action: 'restart' },
            success: (resp) => {
                //you can process stuff before modifying the toast
                txToast.success(`Success:\n${JSON.stringify(resp)}`, { id: toastId });
            },
            error: (error) => {
                txToast.error(`Error: ${error}`, { id: toastId });
            },
        });
    }

    return <>
        <div className="mx-auto mt-auto flex gap-4 group">
            <Button
                size={'lg'}
                variant="default"
                onClick={testSimpleToast}
            >
                Simple Toast
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={testTypedPromise}
            >
                Typed Promise
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={testTypedCallback}
            >
                Typed Callback
            </Button>
        </div>
    </>;
}
