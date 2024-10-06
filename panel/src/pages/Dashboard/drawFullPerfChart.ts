import * as d3 from 'd3';
import { PerfLifeSpanType, PerfSnapType } from './chartingUtils';
import { msToShortDuration } from '@/lib/utils';
import { throttle } from 'throttle-debounce';


//Helpers
const translate = (x: number, y: number) => `translate(${x}, ${y})`;

type AugmentedLifespanType = PerfLifeSpanType & {
    lifespanStartX: number;
    lifespanEndX: number;
    lifespanWidth: number;
}

type drawFullPerfChartProps = {
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
    bucketLabels: string[];
    dataStart: Date;
    dataEnd: Date;
    lifespans: PerfLifeSpanType[];
    cursorSetter: (snap: PerfSnapType | undefined) => void;
};

export default function drawFullPerfChart({
    svgRef,
    canvasRef,
    setRenderError,
    size: { width, height },
    margins,
    isDarkMode,
    bucketLabels,
    dataStart,
    dataEnd,
    lifespans,
    cursorSetter,
}: drawFullPerfChartProps) {
    //Clear SVG
    d3.select(svgRef).selectAll('*').remove(); // FIXME: Clear SVG

    //Setup selectors
    const svg = d3.select<SVGElement, PerfLifeSpanType>(svgRef);
    if (svg.empty()) throw new Error('SVG selection failed.');
    const canvas = d3.select(canvasRef)!;
    if (canvas.empty()) throw new Error('Canvas selection failed.');
    if (!canvasRef?.getContext) {
        throw new Error(`Canvas not supported.`);
    }

    let isFirstRender = true;
    console.log('From:', dataStart.toISOString());
    console.log('To:', dataEnd.toISOString());
    console.log('Window:', msToShortDuration(dataEnd.getTime() - dataStart.getTime()));
    console.log('Number of lifespans:', lifespans.length);
    //closed by the end of file

    //Setup
    const drawableAreaHeight = height - margins.top - margins.bottom;
    const drawableAreaWidth = width - margins.left - margins.right;

    svg.append('clipPath')
        .attr('id', 'fullPerfChartClipPath')
        .append('rect')
        .attr('x', 0)
        .attr('y', margins.top)
        .attr('width', drawableAreaWidth)
        .attr('height', height);

    const chartGroup = svg.append('g')
        .attr('clip-path', 'url(#fullPerfChartClipPath)')
        .attr('transform', translate(margins.left, 0));


    //Fixed Scales
    const timeScale = d3.scaleTime()
        .domain([dataStart, dataEnd])
        .range([0, drawableAreaWidth]);

    const tickBucketsScale = d3.scaleBand()
        .domain(bucketLabels)
        .range([height - margins.bottom, 0]);

    const histColor = d3.scaleSequential(isDarkMode ? d3.interpolateViridis : d3.interpolateCool)
        .domain([0, 1]);


    //Line Scales
    const maxPlayers = d3.max(lifespans, lspn => d3.max(lspn.log, log => log.players))!;
    const maxFxsMemory = d3.max(lifespans, lspn => d3.max(lspn.log, log => log.fxsMemory))!;
    const maxNodeMemory = d3.max(lifespans, lspn => d3.max(lspn.log, log => log.nodeMemory))!;
    const maxPlayersDomain = Math.ceil((maxPlayers + 1) / 5) * 5;
    const lineScalesRange = [height - margins.bottom, margins.top];
    const playersScale = d3.scaleLinear([0, maxPlayersDomain], lineScalesRange);
    const fxsMemoryScale = d3.scaleLinear([0, maxFxsMemory], lineScalesRange)
    const nodeMemoryScale = d3.scaleLinear([0, maxNodeMemory], lineScalesRange)


    //Axis
    const timeAxisTicksScale = d3.scaleLinear([382, 1350], [7, 16]);
    const timeAxis = d3.axisBottom(timeScale)
        .ticks(timeAxisTicksScale(width))
    // .tickFormat(d3.timeFormat('%H:%M'));
    const timeAxisGroup = svg.append("g")
        .attr('transform', translate(margins.left, height - margins.bottom))
        .attr('class', 'time-axis')
        .call(timeAxis);

    const bucketsAxis = d3.axisRight(tickBucketsScale);
    svg.append('g')
        .attr('class', 'buckets-axis')
        .attr('transform', translate(width - margins.right + margins.axis, margins.top))
        .call(bucketsAxis);

    const playersAxisTickValues = (maxPlayers <= 7) ? d3.range(maxPlayers + 1) : null;
    const playersAxis = d3.axisLeft(playersScale)
        .tickFormat(t => t.toString())
        .tickValues(playersAxisTickValues as any); //integer values only 
    svg.append('g')
        .attr('class', 'players-axis')
        .attr('transform', translate(margins.left - margins.axis, 0))
        .call(playersAxis);

    // const fxsMemoryAxisTickValues = (maxFxsMemory <= 7) ? d3.range(maxFxsMemory + 1) : null;
    // const fxsMemoryAxis = d3.axisLeft(fxsMemoryScale)
    //     .tickFormat(t => t.toString() + ' MB')
    //     .tickValues(fxsMemoryAxisTickValues as any); //integer values only 
    // svg.append('g')
    //     .attr('class', 'fxsmem-axis')
    //     .attr('transform', translate(margins.left - margins.axis, 0))
    //     .call(fxsMemoryAxis);

    // const nodeMemoryAxisTickValues = (maxNodeMemory <= 7) ? d3.range(maxNodeMemory + 1) : null;
    // const nodeMemoryAxis = d3.axisLeft(nodeMemoryScale)
    //     .tickFormat(t => t.toString() + ' MB')
    //     .tickValues(nodeMemoryAxisTickValues as any); //integer values only 
    // svg.append('g')
    //     .attr('class', 'nodemem-axis')
    //     .attr('transform', translate(margins.left - margins.axis, 0))
    //     .call(nodeMemoryAxis);


    // Drawing the histogram
    let snapshotsDrawn: PerfSnapType[] = [];
    const bucketYCoords = bucketLabels.map(b => Math.floor(tickBucketsScale(b)!));
    const bucketHeight = Math.ceil(tickBucketsScale.bandwidth());
    const emptyBucketColor = d3.color(histColor(0))!.darker(1.15).formatHsl();
    // const cssBgHslVar = getComputedStyle(document.documentElement)
    //     .getPropertyValue('--background')
    //     .split(' ').join(', ');
    // const cssBgParsed = d3.color(`hsl(${cssBgHslVar})`)!;
    // // const cssBgParsed = d3.color(`#F5F6FA`)!;
    // // const canvasBgColor = cssBgParsed.formatHsl();
    // const canvasBgColor = cssBgParsed.darker(1.05).formatHsl();
    // // const canvasBgColor = cssBgParsed.brighter(1.05).formatHsl();
    const drawCanvasHeatmap = () => {
        //Context preconditions
        const canvasNode = canvas.node();
        if (!canvasNode) return setRenderError('Canvas node not found.');
        const ctx = canvasNode.getContext('2d');
        if (!ctx) return setRenderError('Canvas 2d context not found.');

        //Setup
        isFirstRender && console.time('drawing canvas heatmap');
        ctx.clearRect(0, 0, drawableAreaWidth, drawableAreaHeight);
        ctx.fillStyle = isDarkMode ? '#281C2B' : '#E4D4FA';
        ctx.fillRect(0, 0, drawableAreaWidth, drawableAreaHeight);
        snapshotsDrawn = [];

        //Drawing
        let lifespanCount = 0;
        let rectCount = 0;
        for (const lifespan of lifespans) {
            const { bootTime, closeTime, log } = lifespan;
            const lifespanStartX = bootTime ? timeScale(bootTime) : timeScale(log[0].start);
            const lifespanEndX = closeTime ? timeScale(closeTime) : timeScale(log.at(-1)!.end);
            const lifespanWidth = lifespanEndX - lifespanStartX;
            if (lifespanEndX < 0 || lifespanStartX > drawableAreaWidth) continue;
            if (lifespanWidth < 5) continue;
            lifespanCount++;

            for (const snap of lifespan.log) {
                const histX1 = Math.floor(timeScale(snap.start));
                const histX2 = Math.floor(timeScale(snap.end));
                const histWidth = histX2 - histX1;
                if (!histWidth) continue;
                snapshotsDrawn.push(snap);
                for (let i = 0; i < snap.weightedPerf.length; i++) {
                    const perf = snap.weightedPerf[i];
                    ctx.fillStyle = (perf > 0.001) ? histColor(perf) : emptyBucketColor;
                    ctx.fillRect(histX1, bucketYCoords[i]!, histWidth, bucketHeight);
                    rectCount++
                }
            }
        }
        if (isFirstRender) {
            console.log('Canvas heatmap finished drawing:', { lifespanCount, snapCount: snapshotsDrawn.length, rectCount });
            console.timeEnd('drawing canvas heatmap');
        }
    }
    drawCanvasHeatmap();


    const prepareLifespanDataItem = (d: PerfLifeSpanType): AugmentedLifespanType[] => {
        const lifespanStartX = d.bootTime ? timeScale(d.bootTime) : timeScale(d.log[0].start);
        const lifespanEndX = d.closeTime ? timeScale(d.closeTime) : timeScale(d.log.at(-1)!.end);
        const lifespanWidth = lifespanEndX - lifespanStartX;
        if (
            lifespanWidth < 5
            || lifespanEndX < 0 + margins.left
            || lifespanStartX > drawableAreaWidth + margins.left
        ) {
            return [];
        }

        return [{
            ...d,
            lifespanStartX,
            lifespanEndX,
            lifespanWidth,
        }];
    }

    const drawLifespan = (
        lifespanGSel: d3.Selection<d3.BaseType | SVGGElement, PerfLifeSpanType, SVGElement, unknown>
    ) => {
        // // Close Reason
        // lifespanGSel.selectAll('text.closeReason')
        //     .data(prepareLifespanDataItem)
        //     .join('text')
        //     .attr('class', 'closeReason')
        //     .attr('x', d => d.lifespanEndX)
        //     .attr('y', 0)
        //     .attr('dy', 6)
        //     .attr('text-anchor', 'end')
        //     .attr('dominant-baseline', 'baseline')
        //     .attr('font-size', 12)
        //     .attr('fill', 'rgba(255, 255, 255, 0.75)')
        //     .attr('transform', d => `rotate(-90, ${d.lifespanEndX}, 12)`)
        //     .attr('letter-spacing', '2px') // Add this line to increase letter spacing
        //     .text(d => d.closeReason ?? '');

        // //FXServer memory
        // const fxsMemoryLineGenerator = d3.line<PerfSnapType>()
        //     .defined(d => d.fxsMemory !== null) // Filter out null values
        //     .x(d => timeScale(d.end))
        //     .y(d => fxsMemoryScale(d.fxsMemory as number))
        //     .curve(d3.curveNatural);
        // lifespanGSel.selectAll('path.fxsmem-line')
        //     .data(prepareLifespanDataItem)
        //     .join('path')
        //     .attr('class', 'fxsmem-line')
        //     .each((d, i, nodes) => {
        //         d3.select(nodes[i])
        //             .attr('fill', 'none')
        //             .attr('opacity', 0.75)
        //             .attr('stroke-dasharray', '4 6')
        //             .attr('stroke-linejoin', 'round')
        //             .attr('stroke-linecap', 'round')
        //             .attr('stroke', 'rgb(204, 42, 107)')
        //             .attr('stroke-width', 1.5)
        //             .attr('d', fxsMemoryLineGenerator(d.log));
        //     });

        // //Node memory
        // const nodeMemoryLineGenerator = d3.line<PerfSnapType>()
        //     .defined(d => d.nodeMemory !== null) // Filter out null values
        //     .x(d => timeScale(d.end))
        //     .y(d => nodeMemoryScale(d.nodeMemory as number))
        //     .curve(d3.curveNatural);
        // lifespanGSel.selectAll('path.nodemem-line')
        //     .data(prepareLifespanDataItem)
        //     .join('path')
        //     .attr('class', 'nodemem-line')
        //     .each((d, i, nodes) => {
        //         d3.select(nodes[i])
        //             .attr('fill', 'none')
        //             .attr('opacity', 0.75)
        //             .attr('stroke-dasharray', '4 6')
        //             .attr('stroke-linejoin', 'round')
        //             .attr('stroke-linecap', 'round')
        //             .attr('stroke', 'rgb(202, 204, 42)')
        //             .attr('stroke-width', 1.5)
        //             .attr('d', nodeMemoryLineGenerator(d.log));
        //     });

        //Player lines
        const playerLineGenerator = d3.line<PerfSnapType>(
            (d) => timeScale(d.end),
            (d) => playersScale(d.players),
        ).curve(d3.curveNatural);
        lifespanGSel.selectAll('path.players-line-bg')
            .data(prepareLifespanDataItem)
            .join('path')
            .attr('class', 'players-line-bg')
            .each((d, i, nodes) => {
                d3.select(nodes[i])
                    .attr('fill', 'none')
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 6)
                    .attr('d', playerLineGenerator(d.log));
            })
        lifespanGSel.selectAll('path.players-line')
            .data(prepareLifespanDataItem)
            .join('path')
            .attr('class', 'players-line')
            .each((d, i, nodes) => {
                d3.select(nodes[i])
                    .attr('fill', 'none')
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .attr('stroke', 'rgb(204, 203, 203)')
                    .attr('stroke-width', 2)
                    .attr('d', playerLineGenerator(d.log));
            });

        //DEBUG
        // const totalSvgNodesRecursive = lifespanGSel.selectAll('*').size(); 
        // console.log('Total SVG nodes:', totalSvgNodesRecursive);
    }

    // Drawing the lifespans
    chartGroup.selectAll('g.lifespan')
        .data(lifespans)
        .join('g')
        .attr('class', 'lifespan')
        .call(drawLifespan);


    // // Drawing day/night reference lines
    // //FIXME: correct groups and svg ordering
    // const drawDayNightMarkers = () => {
    //     const dayNightInterval = d3.timeDays(dataStart, dataEnd, 1);
    //     timeAxisGroup.selectAll('rect.day-night')
    //         .data(dayNightInterval)
    //         .join('rect')
    //         .attr('class', 'day-night')
    //         .attr('x', d => timeScale(d))
    //         .attr('y', 0)
    //         .attr('width', (d, i) => {
    //             const dayDrawEnd = dayNightInterval[i + 1] ?? dataEnd;
    //             return timeScale(dayDrawEnd) - timeScale(d);
    //         })
    //         .attr('height', margins.bottom)
    //         .attr('fill', (d, i) => (i % 2) ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.25)');

    //     const timeMarkerInterval = d3.timeHour.every(12)!.range(dataStart, dataEnd);
    //     chartGroup.selectAll('line.time-interval-markers')
    //         .data(timeMarkerInterval)
    //         .join('line')
    //         .attr('class', 'time-interval-markers')
    //         .attr('x1', d => Math.floor(timeScale(d)))
    //         .attr('y1', margins.top)
    //         .attr('x2', d => Math.floor(timeScale(d)))
    //         .attr('y2', margins.top + drawableAreaHeight)
    //         .attr('stroke', 'rgba(200, 200, 200, 0.75)')
    //         .attr('stroke-width', 1)
    //         .attr('stroke-dasharray', '3 3');
    // }
    // drawDayNightMarkers();

    // let referenceX: d3.Selection<SVGLineElement, PerfLifeSpanType, null, undefined>;
    // const drawReferenceLines = () => {
    //     if (referenceX) referenceX.remove();
    //     const referenceLineX = timeScale(new Date(2024, 7, 25, 2, 0, 0, 0));
    //     referenceX = chartGroup.append('line')
    //         .attr('id', 'referenceLineVert')
    //         .attr('x1', referenceLineX)
    //         .attr('y1', margins.top)
    //         .attr('x2', referenceLineX)
    //         .attr('y2', margins.top + drawableAreaHeight)
    //         .attr('stroke', 'red')
    //         .attr('stroke-width', 2);
    // }
    // drawReferenceLines();


    /**
     * Cursor
     */
    const cursorLineVert = chartGroup.append('line')
        .attr('class', 'cursorLineHorz')
        .attr('stroke', 'rgba(216, 245, 19, 0.75)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');
    const cursorLineHorz = chartGroup.append('line')
        .attr('class', 'cursorLineHorz')
        .attr('stroke', 'rgba(216, 245, 19, 0.75)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');
    const cursorDot = chartGroup.append('circle')
        .attr('class', 'cursorDot')
        .attr('fill', 'red')
        .attr('r', 4);
    const cursorTextBg = chartGroup.append('rect')
        .attr('class', 'cursorTextBg')
        .attr('fill', 'black')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('stroke', 'rgba(216, 245, 19, 0.35)')
        .attr('stroke-width', 1);
    const cursorText = chartGroup.append('text')
        .attr('class', 'cursorText font-mono')
        .attr('fill', 'rgba(216, 245, 19)')
        .attr('font-size', 16);
    const cursorTextNode = cursorText.node();

    const clearCursor = () => {
        cursorLineVert.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0);
        cursorDot.attr('cx', -99).attr('cy', -99);
        cursorLineHorz.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0);
        cursorText.attr('x', -99).attr('y', -99);
        cursorTextBg.attr('x', -99).attr('y', -99);
        cursorSetter(undefined);
    };
    clearCursor();


    //Find the closest data point for a given X value
    const maxAllowedGap = 20 * 60 * 1000;
    const timeBisector = d3.bisector((lfspn: PerfSnapType) => lfspn.end).center;
    const getClosestData = (x: number) => {
        if (!snapshotsDrawn.length) return;
        const xPosDate = timeScale.invert(x);
        const indexFound = timeBisector(snapshotsDrawn, xPosDate);
        if (indexFound === -1) return;
        const snapData = snapshotsDrawn[indexFound];
        if (Math.abs(snapData.end.getTime() - xPosDate.getTime()) < maxAllowedGap) {
            return {
                snapIndex: indexFound,
                snapData
            };
        }
    };


    //Detect mouse over and show timestamp + draw vertical line
    let lastFlatSnapsIndex: number | null = null;
    const handleMouseMove = (pointerX: number, pointerY: number) => {
        // Find closest data point
        const findResult = getClosestData(pointerX);
        if (!findResult) {
            lastFlatSnapsIndex = null;
            return clearCursor();
        }
        const { snapIndex, snapData } = findResult;
        if (snapIndex === lastFlatSnapsIndex) return;
        lastFlatSnapsIndex = snapIndex;
        cursorSetter(snapData);

        const pointData = {
            x: Math.round(timeScale(snapData.end)) + 0.5,
            y: Math.round(playersScale(snapData.players)) + 0.5,
            val: snapData.players
        };

        // Draw cursor
        cursorLineVert.attr('x1', pointData.x)
            .attr('y1', 0)
            .attr('x2', pointData.x)
            .attr('y2', drawableAreaHeight);
        cursorLineHorz.attr('x1', 0)
            .attr('y1', pointData.y)
            .attr('x2', drawableAreaWidth)
            .attr('y2', pointData.y);
        cursorDot.attr('cx', pointData.x)
            .attr('cy', pointData.y);

        const countString = pointData.val.toString();
        const isTextTooLeft = pointData.x < 50;
        const isTextTooHigh = pointData.y < 50;
        cursorText.text(countString)
            .attr('x', isTextTooLeft ? pointData.x + 20 : pointData.x - 15)
            .attr('y', isTextTooHigh ? pointData.y + 15 : pointData.y - 15)
            .attr('text-anchor', isTextTooLeft ? 'start' : 'end')
            .attr('dominant-baseline', isTextTooHigh ? 'hanging' : 'baseline');
        if (!cursorTextNode) return;
        const cursorTextBBox = cursorTextNode.getBBox();
        const bgPadX = 6;
        const bgPadY = 2;
        cursorTextBg
            .attr('x', Math.round(cursorTextBBox.x) - bgPadX - 0.5)
            .attr('y', Math.round(cursorTextBBox.y) - bgPadY - 0.5)
            .attr('width', Math.round(cursorTextBBox.width) + bgPadX * 2)
            .attr('height', Math.round(cursorTextBBox.height) + bgPadY * 2);
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


    /**
     * Zoom
     */
    let wasZoomed = false;
    const zoomedHandler = ({ transform }: d3.D3ZoomEvent<SVGElement, PerfLifeSpanType>) => {
        //Prevent spamming re-renders when zoomed out
        if (transform.k === 1 && transform.x === 0) {
            if (!wasZoomed) return;
            wasZoomed = false
        } else {
            wasZoomed = true;
        }

        timeScale.range([
            parseFloat(transform.applyX(0).toFixed(6)),
            parseFloat(transform.applyX(drawableAreaWidth).toFixed(6)),
        ]);
        timeAxis.scale(transform.rescaleX(timeScale).range([0, drawableAreaWidth]));
        timeAxisGroup.call(timeAxis);

        //@ts-ignore
        chartGroup.selectAll('g.lifespan').call(drawLifespan);

        clearCursor();
        drawCanvasHeatmap();
        // drawDayNightMarkers();
        // drawReferenceLines();
    }
    const debouncedZoomHandler = throttle(20, zoomedHandler, { noLeading: false, noTrailing: false });

    const zoomExtent = [
        [0, margins.top],
        [drawableAreaWidth, height - margins.top]
    ] satisfies [[number, number], [number, number]];
    const zoomBehavior = d3.zoom<SVGElement, PerfLifeSpanType>()
        .scaleExtent([1, 12])
        .translateExtent(zoomExtent)
        .extent(zoomExtent)
        .on('zoom', debouncedZoomHandler);
    svg.call(zoomBehavior)
    //FIXME: to prevent double rendering on first render, need to move this transform up
    //     .transition()
    //     .duration(750)
    //     .call(zoomBehavior.scaleTo, 2, [timeScale(new Date()), 0]);

    isFirstRender = false;
}
