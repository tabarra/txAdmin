import * as d3 from 'd3';
import { createRandomHslColor, msToShortDuration, numberToLocaleString } from '@/lib/utils';
import { throttle } from 'throttle-debounce';
import { playerDropCategories, playerDropCategoryDefaultColor } from "@/lib/playerDropCategories";
import { PlayerDropsCategoryCount } from './chartingUtils';
import { TimelineDropsChartData } from './TimelineDropsChart';


//Helpers
const translate = (x: number, y: number) => `translate(${x}, ${y})`;

export type TimelineDropsDatum = {
    hour: Date;
    drops: PlayerDropsCategoryCount[];
}

type drawDropsTimelineProps = {
    svgRef: SVGElement;
    canvasRef: HTMLCanvasElement;
    setRenderError: (error: string) => void;
    size: {
        width: number;
        height: number;
    };
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        axis: number;
    };
    isDarkMode: boolean;
    data: TimelineDropsChartData,
};

export default function drawDropsTimeline({
    svgRef,
    canvasRef,
    setRenderError,
    size: { width, height },
    margins,
    isDarkMode,
    data,
}: drawDropsTimelineProps) {
    //Clear SVG
    d3.select(svgRef).selectAll('*').remove(); // FIXME: Clear SVG

    //Setup selectors
    const svg = d3.select<SVGElement, TimelineDropsDatum>(svgRef);
    if (svg.empty()) throw new Error('SVG selection failed.');
    const canvas = d3.select(canvasRef)!;
    if (canvas.empty()) throw new Error('Canvas selection failed.');
    if (!canvasRef?.getContext) {
        throw new Error(`Canvas not supported.`);
    }

    let isFirstRender = true;
    console.log('From:', data.startDate.toISOString());
    console.log('To:', data.endDate.toISOString());
    console.log('Window:', msToShortDuration(data.startDate.getTime() - data.endDate.getTime()));
    console.log('Number of hours:', data.log.length);

    //Setup
    const drawableAreaHeight = height - margins.top - margins.bottom;
    const drawableAreaWidth = width - margins.left - margins.right;
    console.log('Drawable area:', drawableAreaWidth, drawableAreaHeight);

    const chartGroup = svg.append('g')
        .attr('transform', translate(margins.left, 0));


    //Scales
    const timeScale = d3.scaleTime(
        [data.startDate, data.endDate],
        [0, drawableAreaWidth],
    );

    const countsScale = d3.scaleLinear(
        [0, data.maxDrops],
        [height - margins.bottom, margins.top],
    );


    //Axis
    const timeAxisTicksScale = d3.scaleLinear([382, 1350], [7, 16]);
    const timeAxis = d3.axisBottom(timeScale)
        .ticks(timeAxisTicksScale(width))
    // .tickFormat(d => d && dateToLocaleTimeString(d as Date, 'numeric', '2-digit'));
    // .tickFormat(d3.timeFormat('%H:%M'));
    const timeAxisGroup = chartGroup.append("g")
        .attr('transform', translate(0, height - margins.bottom))
        .attr('class', 'time-axis')
        .call(timeAxis);

    const countsAxisTickValues = (data.maxDrops <= 7) ? d3.range(data.maxDrops + 1) : null;
    const countsAxis = d3.axisLeft(countsScale)
        .ticks(6)
        .tickFormat(d => numberToLocaleString(d as number))
        .tickValues(countsAxisTickValues as any); //integer values only 
    const countsAxisGroup = svg.append('g')
        .attr('class', 'players-axis')
        .attr('transform', translate(margins.left - margins.axis, 0))
        .call(countsAxis)

    // Drawing the timeline
    const periodInHours = data.selectedPeriod === 'day' ? 24 : 1;
    const endOfFirstInterval = new Date(data.startDate.getTime() + (periodInHours * 60 * 60 * 1000));
    const intervalWidth = timeScale(endOfFirstInterval) - timeScale(data.startDate);
    const canvasCountScale = (value: number) => countsScale(value) - margins.top;

    const drawCanvasTimeline = () => {
        //Context preconditions
        const canvasNode = canvas.node();
        if (!canvasNode) return setRenderError('Canvas node not found.');
        const ctx = canvasNode.getContext('2d');
        if (!ctx) return setRenderError('Canvas 2d context not found.');
        if (!intervalWidth) return setRenderError('Cannot render with zero interval width');

        //Setup
        isFirstRender && console.time('drawing canvas timeline');
        ctx.clearRect(0, 0, drawableAreaWidth, drawableAreaHeight);
        if (isDarkMode) {
            ctx.fillStyle = '#00000055'
            ctx.fillRect(0, 0, drawableAreaWidth, drawableAreaHeight);
        }

        //Drawing horizontal ticks - trycatcking because it's a bit fragile
        ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, 0.15)` : `rgba(0, 0, 0, 0.35)`;

        ctx.setLineDash([2, 2]);
        console.group('AxisLines:');
        try {
            const tickLines = countsAxisGroup.selectAll("g.tick").nodes();
            for (const tickLine of tickLines) {
                const translation = (tickLine as any)?.getAttribute('transform');
                if (!translation) continue;
                const y = Math.round(+translation.split(',')[1].replace(')', '') - margins.top) + 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(drawableAreaWidth, y);
                ctx.stroke();
            }
        } catch (error) {
            console.error('Error drawing horizontal ticks:', error);
        }
        ctx.setLineDash([]);
        console.groupEnd();





        //Drawing hour bars
        ctx.lineWidth = 1;
        for (const hour of data.log) {
            const baseX = timeScale(hour.hour);
            if (baseX < 0 || baseX > drawableAreaWidth) continue;

            const renderStartX = Math.round(baseX);
            const renderOffsetX = baseX - renderStartX;
            const barWidth = Math.round(intervalWidth + renderOffsetX) + 1;
            if (barWidth < 1) continue;

            //Draw the count blocks
            let dropSum = 0;
            let lastRenderBottomY = drawableAreaHeight;
            for (const [dropCategory, dropCount] of hour.drops) {
                if (!dropCount) continue;
                const barBottomY = lastRenderBottomY-1;
                const barTopY = canvasCountScale(dropSum + dropCount) + 1;
                const barHeight = barBottomY - barTopY;
                const barHeightRnd = Math.floor(barHeight);
                const rndDiff = barHeight - barHeightRnd;

                if (hour.hour.getTime() === (new Date('2024-07-06T12:00:00.000Z')).getTime()) {
                    console.group(`${dropCategory}: ${dropCount} drops`);
                    console.log({ barBottomY, barHeight, barHeightRnd });
                    console.groupEnd();
                }
                /*
                    Drawing line at y: 94  .5
                    Drawing line at y: 71  .5
                    Drawing line at y: 48  .5
                    Drawing line at y: 25  .5
                */


                dropSum += dropCount;
                // if (barHeight < 1) continue; //FIXME: re-enable
                lastRenderBottomY = barBottomY - barHeightRnd;

                //Draw the bar
                ctx.fillStyle = playerDropCategories[dropCategory]?.color ?? 'white';
                ctx.fillRect(
                    renderStartX, barBottomY,
                    barWidth, -barHeightRnd,
                );

                ctx.strokeStyle = playerDropCategories[dropCategory]?.border ?? 'black';
                ctx.strokeRect(
                    renderStartX + 0.5, barBottomY + 0.5,
                    barWidth - 1, -barHeightRnd - 1,
                );
            }
        }
        if (isFirstRender) {
            console.timeEnd('drawing canvas timeline');
        }
    }
    drawCanvasTimeline();




    isFirstRender = false;
}
