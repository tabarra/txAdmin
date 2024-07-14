import * as d3 from 'd3';
import { msToShortDuration, numberToLocaleString } from '@/lib/utils';
import { playerDropCategories } from "@/lib/playerDropCategories";
import { PlayerDropsCategoryCount } from './chartingUtils';
import { TimelineDropsChartData } from './TimelineDropsChart';


//Helpers
const translate = (x: number, y: number) => `translate(${x}, ${y})`;

export type TimelineDropsDatum = {
    hour: Date;
    drops: PlayerDropsCategoryCount[];
}

type drawDropsTimelineProps = {
    legendRef: HTMLDivElement;
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
    legendRef,
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
        .ticks(height > 200 ? 6 : 4)
        .tickFormat(d => numberToLocaleString(d as number))
        .tickValues(countsAxisTickValues as any); //integer values only 
    const countsAxisGroup = svg.append('g')
        .attr('class', 'players-axis')
        .attr('transform', translate(margins.left - margins.axis, 0))
        .call(countsAxis)


    /**
     * Canvas
     */
    const periodInHours = data.selectedPeriod === 'day' ? 24 : 1;
    const endOfFirstInterval = new Date(data.startDate.getTime() + (periodInHours * 60 * 60 * 1000));
    const intervalWidth = timeScale(endOfFirstInterval) - timeScale(data.startDate);
    const canvasTicksStyle = isDarkMode ? `rgba(255, 255, 255, 0.15)` : `rgba(0, 0, 0, 0.35)`;
    const canvasBackgroundStyle = isDarkMode ? '#00000035' : '#00000007';
    const canvasCountScale = (value: number) => countsScale(value) - margins.top;

    const drawCanvasTimeline = () => {
        //Context preconditions
        const canvasNode = canvas.node();
        if (!canvasNode) return setRenderError('Canvas node not found.');
        const ctx = canvasNode.getContext('2d');
        if (!ctx) return setRenderError('Canvas 2d context not found.');
        if (!intervalWidth) return setRenderError('Cannot render with zero interval width.');

        //Setup
        isFirstRender && console.time('drawing canvas timeline');
        ctx.clearRect(0, 0, drawableAreaWidth, drawableAreaHeight);
        ctx.fillStyle = canvasBackgroundStyle;
        ctx.fillRect(0, 0, drawableAreaWidth, drawableAreaHeight);

        //Drawing horizontal ticks - trycatcking because it's a bit fragile
        ctx.strokeStyle = canvasTicksStyle;
        ctx.setLineDash([2, 2]);
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

        //Drawing the timeline
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
            let lastRenderBottomY = drawableAreaHeight + 1;
            for (const [dropCategory, dropCount] of hour.drops) {
                if (!dropCount) continue;
                const barBottomY = lastRenderBottomY - 1;
                const barTopY = canvasCountScale(dropSum + dropCount) + 1;
                const barHeight = barBottomY - barTopY;
                const barHeightRnd = Math.max(
                    Math.floor(barHeight),
                    barHeight > 0.8 ? 1 : 0
                );

                dropSum += dropCount;
                if (barHeightRnd < 1) continue;
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


    /**
     * Cursor
     */
    const cursorLineVert = chartGroup.append('line')
        .attr('stroke', isDarkMode ? 'rgba(216, 245, 19, 0.75)' : 'rgba(62, 70, 5, 0.75)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

    const clearCursor = () => {
        cursorLineVert.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0);
        legendRef.style.opacity = '0';
    };
    clearCursor();

    //Find the closest data point for a given X value
    const maxAllowedGap = (data.selectedPeriod === 'day' ? 24 : 1) * 60 * 60 * 1000 / 2; //half the period in ms
    const timeBisector = d3.bisector((hour: TimelineDropsDatum) => hour.hour).center;
    const getClosestData = (x: number) => {
        const xPosDate = timeScale.invert(x);
        const indexFound = timeBisector(data.log, xPosDate);
        if (indexFound === -1) return;
        const hourData = data.log[indexFound];
        if (Math.abs(hourData.hour.getTime() - xPosDate.getTime()) < maxAllowedGap) {
            return {
                hourIndex: indexFound,
                hourData
            };
        }
    };

    //Detect mouse over and show timestamp + draw vertical line
    let lastHourIndex: number | null = null;
    const handleMouseMove = (pointerX: number, pointerY: number) => {
        // Find closest data point
        const findResult = getClosestData(pointerX - intervalWidth / 2);
        if (!findResult) {
            lastHourIndex = null;
            return clearCursor();
        }
        const { hourIndex, hourData } = findResult;
        if (hourIndex === lastHourIndex) return;
        lastHourIndex = hourIndex;
        const hourX = Math.round(timeScale(hourData.hour) + intervalWidth / 2) + 0.5

        //Set legend data
        const allNumEls = legendRef.querySelectorAll('span[data-category]');
        for (const numEl of allNumEls) {
            const catName = numEl.getAttribute('data-category');
            if (!catName) continue;
            const catCount = hourData.drops.find(([cat]) => cat === catName)?.[1] ?? 0;
            numEl.textContent = numberToLocaleString(catCount);
        }

        //Move legend
        let wasTransitionDisabled = false;
        if(legendRef.style.opacity === '0') {
            legendRef.style.transitionProperty = 'opacity';
            wasTransitionDisabled = true;
        }
        const legendWidth = legendRef.clientWidth;
        let legendX = hourX - legendWidth - 10 + margins.left;
        if (legendX < margins.left) legendX = hourX + 10 + margins.left;
        legendRef.style.left = `${legendX}px`;
        legendRef.style.opacity = '1';
        if(wasTransitionDisabled) {
            setTimeout(() => {
                legendRef.style.transitionProperty = 'all';
            }, 0);
        }

        // Draw cursor
        cursorLineVert.attr('x1', hourX).attr('y1', 0).attr('x2', hourX).attr('y2', drawableAreaHeight);
    };

    // Handle svg mouse events
    let isEventInCooldown = false;
    let cursorRedrawTimeout: NodeJS.Timeout;
    const cooldownTime = 20;
    chartGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', drawableAreaWidth)
        .attr('height', drawableAreaHeight)
        .attr('fill', 'transparent')
        .on('mousemove', function (event) {
            const [pointerX, pointerY] = d3.pointer(event);
            if (!isEventInCooldown) {
                isEventInCooldown = true;
                handleMouseMove(pointerX, pointerY);
                setTimeout(() => {
                    isEventInCooldown = false;
                }, cooldownTime);
            } else {
                clearTimeout(cursorRedrawTimeout);
                cursorRedrawTimeout = setTimeout(() => {
                    handleMouseMove(pointerX, pointerY);
                }, cooldownTime);
            }
        })
    svg.on('mouseleave', function () {
        setTimeout(() => {
            clearCursor();
        }, 150);
    });

    isFirstRender = false;
}
