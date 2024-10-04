import InlineCode from "@/components/InlineCode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import useSWRImmutable from "swr/immutable";

export default function TmpSwr() {
    const [counter, setCounter] = useState(0);
    const renderTime = Date.now();
    const swr = useSWRImmutable(`/whatever?counter=${counter}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        console.log('Request: ', `/whatever?counter=${counter}`);
        return {
            ts: renderTime,
            counter: counter,
            rand: Math.random().toString(36).substring(2, 8),
        };
    }, {});

    const isDataFresh = swr.data?.ts && renderTime - swr.data.ts < 1000;
    return (
        <div className="w-full">
            <div className="flex flex-col justify-center items-center gap-4">
                <p>
                    Note how there is no useEffect to do swr.mutate() on counter change.
                </p>

                <div className="flex gap-3 font-mono tracking-wider">
                    <Button size={'sm'} onClick={() => setCounter((curr) => curr - 1)}>--</Button>
                    <div className="px-2 py-1.5 min-w-[4ch] rounded-md text-center bg-gray-300">{counter}</div>
                    <Button size={'sm'} onClick={() => setCounter((curr) => curr + 1)}>++</Button>
                </div>
                <table className="text-left border border-gray-300">
                    <tbody>
                        <tr>
                            <th className="p-2 border border-gray-300">Data</th>
                            <td className="p-2 border border-gray-300 text-center min-w-[8ch]">
                                {swr.data?.counter}
                            </td>
                        </tr>
                        <tr>
                            <th className="p-2 border border-gray-300 bg-gray-200">Rand</th>
                            <td className="p-2 border border-gray-300 bg-gray-200 text-center">
                                {swr.data?.rand}
                            </td>
                        </tr>
                        <tr>
                            <th className="p-2 border border-gray-300">Status</th>
                            <td className={cn(
                                "p-2 border border-gray-300 text-center",
                                swr.data ? isDataFresh ? 'bg-green-300' : 'bg-red-300' : 'bg-gray-300',
                                swr.data ? 'opacity-100' : 'opacity-50'
                            )}>
                                {swr.data ? isDataFresh ? 'Fresh' : 'Stale' : ''}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    {JSON.stringify(swr.data)}
                </div>
            </div>
        </div>
    );
}
