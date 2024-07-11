import DebouncedResizeContainer from "@/components/DebouncedResizeContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DoorOpenIcon, SkullIcon } from "lucide-react";
import { memo, useState } from "react";


type PlayerDropsTimelineChartsProps = {
    //
};

const PlayerDropsTimelineChartsInner = ({ }: PlayerDropsTimelineChartsProps) => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>('day');
    const [dropsChartSize, setDropsChartSize] = useState({ width: 0, height: 0 });
    const [crashesChartSize, setCrashesChartSize] = useState({ width: 0, height: 0 });
    return (
        <div className="md:rounded-xl border bg-card shadow-sm flex flex-col">

            <div className="pb-2">
                <div className="flex flex-row items-center justify-between px-1 sm:px-4 border-b rounded-t-xl bg-secondary/35">
                    <div className="flex items-center py-2 space-x-2">
                        <div className='hidden xs:block'><DoorOpenIcon className="size-4" /></div>
                        <h2 className="font-mono text-sm">Player Drops</h2>
                    </div>
                    <Select defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger
                            className="w-32 h-6 px-3 py-1 text-sm"
                        >
                            <SelectValue placeholder="Filter by admin" />
                        </SelectTrigger>
                        <SelectContent className="px-0">
                            <SelectItem value={'day'} className="cursor-pointer">
                                Days
                            </SelectItem>
                            <SelectItem value={'hour'} className="cursor-pointer">
                                Hours
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="h-56 max-h-56">
                    <DebouncedResizeContainer onDebouncedResize={setDropsChartSize}>
                        <div className="absolute inset-0 flex items-center justify-center bg-fuchsia-950">
                            <div className="text-2xl text-center text-fuchsia-300">
                                {dropsChartSize.width}x{dropsChartSize.height} <br />
                                stacked bar charts with the drop reasons <br />
                                where do I put the legends?!
                            </div>
                        </div>
                    </DebouncedResizeContainer>
                </div>
            </div>

            <div className="pb-2">
                <div className="flex flex-col flex-shrink px-1 sm:px-4 py-2 space-y-4 border-t border-b bg-secondary/35">
                    <div className="flex items-center space-x-2">
                        <div className='hidden xs:block'><SkullIcon className="size-4" /></div>
                        <h2 className="font-mono text-sm">Player Crashes</h2>
                    </div>
                </div>
                <div className="h-32 max-h-32">
                    <DebouncedResizeContainer onDebouncedResize={setCrashesChartSize}>
                        <div className="absolute inset-0 flex items-center justify-center bg-fuchsia-950">
                            <div className="text-2xl text-center text-fuchsia-300">
                                {crashesChartSize.width}x{crashesChartSize.height} <br />
                                bar chart for counts + line chart for rate <br />
                                two axis, one for each type
                            </div>
                        </div>
                    </DebouncedResizeContainer>
                </div>
            </div>
        </div>
    );
};

export default memo(PlayerDropsTimelineChartsInner);
