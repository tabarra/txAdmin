import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWarningBarData } from "@/hooks/interface";

export default function TmpUpdateState() {
    const {
        isSocketOffline, setIsSocketOffline,
        txUpdateData, setTxUpdateData,
        fxUpdateData, setFxUpdateData,
    } = useWarningBarData();

    return (
        <Card className="w-min">
            <CardHeader>
                <CardTitle>Warning Bar States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 rounded border p-2">
                    <pre className="bg-muted p-2">
                        {JSON.stringify(isSocketOffline, null, 2)}
                    </pre>
                    <div className="flex justify-start gap-3 border-t pt-2">
                        <Button size="sm" onClick={() => setIsSocketOffline(false)}>
                            Socket On
                        </Button>
                        <Button size="sm" onClick={() => setIsSocketOffline(true)}>
                            Socket Off
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 rounded border p-2">
                    <pre className="bg-muted p-2">
                        {JSON.stringify(txUpdateData, null, 2)}
                    </pre>
                    <div className="flex justify-start gap-3 border-t pt-2">
                        <Button size="sm" onClick={() => setTxUpdateData({
                            ver: 'v7.0.1',
                            isMajor: false,
                        })}>
                            txa Minor Update
                        </Button>
                        <Button size="sm" onClick={() => setTxUpdateData({
                            ver: 'v8.0.0',
                            isMajor: true,
                        })}>
                            txa Major Update
                        </Button>
                        <Button size="sm" onClick={() => setTxUpdateData(false)}>
                            txa No Update
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 rounded border p-2">
                    <pre className="bg-muted p-2">
                        {JSON.stringify(fxUpdateData, null, 2)}
                    </pre>
                    <div className="flex justify-start gap-3 border-t pt-2">
                        <Button size="sm" onClick={() => setFxUpdateData({
                            ver: 'v7.0.1',
                            isMajor: false,
                        })}>
                            fxs Minor Update
                        </Button>
                        <Button size="sm" onClick={() => setFxUpdateData({
                            ver: 'v8.0.0',
                            isMajor: true,
                        })}>
                            fxs Major Update
                        </Button>
                        <Button size="sm" onClick={() => setFxUpdateData(false)}>
                            fxs No Update
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
