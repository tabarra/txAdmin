import * as d3 from 'd3';
import { PerfLifeSpanType, PerfSnapType } from './chartingUtils';
import { createRandomHslColor } from '@/lib/utils';
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
    boundaries: string[];
    dataStart: Date;
    dataEnd: Date;
    lifespans: PerfLifeSpanType[];
};

export default function drawFullPerfChart({
    svgRef,
    canvasRef,
    size: { width, height },
    margins,
    boundaries,
    dataStart,
    dataEnd,
    lifespans,
}: drawFullPerfChartProps) {
    //FIXME: checar se tem contexto
    // if (!canvasRef?.getContext) {
    //     // canvas-unsupported code here
    // }
    //FIXME: passar um state setter de erro aqui pra função, ou então dar throw aqui e capturar no componente

    // FIXME: DEBUG Clear SVG
    console.clear();
    d3.select(svgRef).selectAll("*").remove();
    const svg = d3.select<SVGElement, PerfLifeSpanType>(svgRef);
    const canvas = d3.select(canvasRef)!;

    //Setup
    // const bgColor = 
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
        .attr('id', 'fullPerfChartGroup')
        .attr('transform', translate(margins.left, 0));


    //Fixed Scales
    const timeScale = d3.scaleTime()
        .domain([dataStart, dataEnd])
        .range([0, drawableAreaWidth]);

    const tickBucketsScale = d3.scaleBand()
        .domain(boundaries)
        .range([height - margins.bottom, margins.top]);

    const histColor = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, 1]);


    //Line Scales
    const maxPlayers = d3.max(lifespans, lspn => d3.max(lspn.log, log => log.players))!;
    const maxFxsMemory = d3.max(lifespans, lspn => d3.max(lspn.log, log => log.fxsMemory))!;
    const maxNodeMemory = d3.max(lifespans, lspn => d3.max(lspn.log, log => log.nodeMemory))!;
    const y2Padding = Math.round(tickBucketsScale.bandwidth() / 2);
    const lineScalesRange = [height - margins.bottom - y2Padding, margins.top + y2Padding];
    const playersScale = d3.scaleLinear([0, maxPlayers], lineScalesRange);
    const fxsMemoryScale = d3.scaleLinear([0, maxFxsMemory], lineScalesRange)
    const nodeMemoryScale = d3.scaleLinear([0, maxNodeMemory], lineScalesRange)


    //Axis
    const timeAxis = d3.axisBottom(timeScale);
    chartGroup.append("g")
        .attr("transform", translate(0, height - margins.bottom))
        .attr("class", 'time-axis')
        .call(timeAxis);

    const bucketsAxis = d3.axisRight(tickBucketsScale);
    svg.append("g")
        .attr("class", "buckets-axis")
        .attr("transform", translate(width - margins.right + margins.axis, 0))
        .call(bucketsAxis);

    const playersAxisTickValues = (maxPlayers <= 7) ? d3.range(maxPlayers + 1) : null;
    const playersAxis = d3.axisLeft(playersScale)
        .tickFormat(t => t.toString())
        .tickValues(playersAxisTickValues as any); //integer values only 
    svg.append("g")
        .attr("class", "players-axis")
        .attr("transform", translate(margins.left - margins.axis, 0))
        .call(playersAxis);


    // Drawing the histogram
    // const bucketYCoords = boundaries.map(b => tickBucketsScale(b)!);
    // const bucketHeight = tickBucketsScale.bandwidth();
    const bucketYCoords = boundaries.map(b => Math.floor(tickBucketsScale(b)!));
    const bucketHeight = Math.ceil(tickBucketsScale.bandwidth());
    const emptyBucketColor = d3.color(histColor(0))!.darker(1.15).formatHsl();
    const cssBgHslVar = getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .split(' ').join(', ');
    const cssBgParsed = d3.color(`hsl(${cssBgHslVar})`)!;
    const canvasBgColor = cssBgParsed.darker(1.05).formatHsl();
    // const canvasBgColor = cssBgParsed.brighter(1.05).formatHsl();
    const drawCanvasHeatmap = () => {
        // console.time('drawing canvas heatmap');
        //Setup
        //FIXME: check if the canvas is supported
        const ctx = canvas.node()!.getContext('2d')!;
        ctx.clearRect(0, 0, drawableAreaWidth, drawableAreaHeight);
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, drawableAreaWidth, drawableAreaHeight);

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
                for (let i = 0; i < snap.weightedPerf.length; i++) {
                    const perf = snap.weightedPerf[i];
                    ctx.fillStyle = (perf > 0.001) ? histColor(perf) : emptyBucketColor;
                    ctx.fillRect(histX1, bucketYCoords[i]!, histWidth, bucketHeight);
                    rectCount++
                }
            }
        }
        // console.timeEnd('drawing canvas heatmap');
        // console.log('Canvas heatmap finished drawing:', { lifespanCount, rectCount });
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
        //Background
        lifespanGSel.selectAll('rect.bg')
            .data(prepareLifespanDataItem)
            .join('rect')
            .attr('class', 'bg')
            .attr('x', d => d.lifespanStartX)
            .attr('y', margins.top)
            .attr('width', d => d.lifespanWidth)
            .attr('height', 5)
            .attr('fill', d => createRandomHslColor());
        // .attr('height', drawableAreaHeight)
        // .attr('fill', 'rgba(0, 0, 0, 0.25)');

        //Player lines
        // const nodeMemoryLineGenerator = d3.line<PerfSnapType>(
        //     (d) => timeScaleSvg(d.end),
        //     (d) => nodeMemoryScale(d.nodeMemory),
        // );
        // const fxsMemoryLineGenerator = d3.line<PerfSnapType>(
        //     (d) => timeScaleSvg(d.end),
        //     (d) => fxsMemoryScale(d.fxsMemory),
        // );
        const playerLineGenerator = d3.line<PerfSnapType>(
            (d) => timeScale(d.end),
            (d) => playersScale(d.players),
        );
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


    // let referenceX: d3.Selection<SVGLineElement, PerfLifeSpanType, null, undefined>;
    // const drawReferenceLines = () => {
    //     if (referenceX) referenceX.remove();
    //     const referenceLineX = timeScale(new Date(2024, 5, 6, 21, 0, 0, 0));
    //     referenceX = chartGroup.append('line')
    //         .attr('id', 'referenceLineVert')
    //         .attr('x1', referenceLineX)
    //         .attr('y1', 0)
    //         .attr('x2', referenceLineX)
    //         .attr('y2', drawableAreaHeight)
    //         .attr('stroke', 'red')
    //         .attr('stroke-width', 2);
    // }
    // drawReferenceLines();


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

        timeAxis.ticks(Math.ceil(10 * transform.k));
        // timeAxis.ticks(d3.timeMinute.every(15));
        //@ts-ignore
        chartGroup.selectAll(`g.time-axis`).call(timeAxis);
        //@ts-ignore
        chartGroup.selectAll('g.lifespan').call(drawLifespan);

        drawCanvasHeatmap();
        // drawReferenceLines();
    }
    const debouncedZoomHandler = throttle(20, zoomedHandler, { noLeading: false, noTrailing: false })

    const zoomExtent = [
        [0, margins.top],
        [drawableAreaWidth, height - margins.top]
    ] satisfies [[number, number], [number, number]];
    const zoomBehavior = d3.zoom<SVGElement, PerfLifeSpanType>()
        .scaleExtent([1, 12])
        .translateExtent(zoomExtent)
        .extent(zoomExtent)
        .on("zoom", debouncedZoomHandler);
    svg.call(zoomBehavior);
}
