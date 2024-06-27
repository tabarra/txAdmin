import { Button } from "@/components/ui/button";
import { txToast } from "@/components/TxToaster";
import { useBackendApi } from "@/hooks/fetch";


export default function TmpToasts() {
    const openDefault = () => {
        txToast.default('default');
        txToast.info('info');
        txToast.success('success');
        txToast.warning('warning');
        txToast.error('error');
    }

    const openSpecial = () => {
        txToast.loading('long simulated loading', { duration: 15_000 });
        txToast.default('longer duration', { duration: 10_000 });
        txToast.default('Simple text\nLine Break');
        txToast.default({
            title: 'Object message',
            msg: 'Simple message **without** markdown\nbut auto line break.',
        });
        txToast.error({
            title: 'Error: The bot requires the `GUILD_MEMBERS` intent:',
            msg: `- Go to the [Discord Dev Portal](https://discord.com/developers/applications)
            - Navigate to \`Bot > Privileged Gateway Intents\`.
            - Enable the \`GUILD_MEMBERS\` intent.
            - Save on the dev portal.
            - Go to the \`txAdmin > Settings > Discord Bot\` and press save.`,
            md: true,
        });
    }

    const openUpdatable = () => {
        const toastId = txToast.loading('loading...');
        setTimeout(() => {
            // txToast.dismiss(toastId);
            txToast.success('Bla bla bla!', { id: toastId });
        }, 2500);
    }

    const openApiResp = () => {
        //NOTE: the ApiToastResp type allows for a `title` property
        const exampleApiResp = {
            type: 'error',
            md: true,
            msg: 'This is a **markdown** message',
        } as const;
        txToast({ title: 'Error saving whatever', ...exampleApiResp });
    }

    const fxsControlApi = useBackendApi({
        method: 'POST',
        path: '/fxserver/controls'
    });

    const testPendingBug = () => {
        fxsControlApi({
            data: { action: 'bug' },
            toastLoadingMessage: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        });
    }

    return <>
        <div className="mx-auto mt-auto flex gap-4 group">
            <Button
                size={'lg'}
                variant="outline"
                onClick={() => { txToast.dismiss() }}
            >
                Wipe
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={openDefault}
            >
                Default
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={openSpecial}
            >
                Special
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={openUpdatable}
            >
                Updatable
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={openApiResp}
            >
                API Resp
            </Button>
            <Button
                size={'lg'}
                variant="default"
                onClick={testPendingBug}
            >
                <p>
                    Pending Bug <br />
                    <small>(click twice)</small>
                </p>
            </Button>
        </div>
    </>;
}
