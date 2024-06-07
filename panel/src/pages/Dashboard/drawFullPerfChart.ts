import * as d3 from 'd3';
import { PerfLifeSpanType, PerfSnapType } from './chartingUtils';
import { createRandomHslColor } from '@/lib/utils';


//Helpers
const translate = (x: number, y: number) => `translate(${x}, ${y})`;

type drawFullPerfChartProps = {
    svgRef: SVGSVGElement;
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
    const svg = d3.select(svgRef);

    //Fixed Scales
    const timeScale = d3.scaleTime()
        .domain([dataStart, dataEnd])
        .range([margins.left, width - margins.right]);

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
    svg.append("g")
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


    //Pre-calculated values
    const bgColor = '#2A2A2A';
    const drawableAreaHeight = height - margins.top - margins.bottom;
    const drawableAreaWidth = width - margins.left - margins.right;
    const bucketYCoords = boundaries.map(b => tickBucketsScale(b)!);
    //FIXME: filter out the lifespans that are too small to be drawn


    //Canvas setup
    const canvas = d3.select(canvasRef)!;
    const ctx = canvas.node()!.getContext('2d')!;
    ctx.clearRect(0, 0, drawableAreaWidth, drawableAreaHeight);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, drawableAreaWidth, drawableAreaHeight);


    // Drawing the histogram
    const drawCanvasHeatmap = () => {
        //FIXME: check again for context, clear canvas
        console.time('drawing canvas heatmap');
        let lifespanCount = 0;
        let rectCount = 0;
        for (const lifespan of lifespans) {
            const { bootTime, closeTime, log } = lifespan;
            const lifespanStartX = bootTime ? timeScale(bootTime) : timeScale(log[0].start);
            const lifespanEndX = closeTime ? timeScale(closeTime) : timeScale(log.at(-1)!.end);
            const lifespanWidth = lifespanEndX - lifespanStartX;
            if (lifespanWidth < 5) continue;
            lifespanCount++;

            for (const snap of lifespan.log) {
                const histX1 = Math.floor(timeScale(snap.start));
                const histX2 = Math.floor(timeScale(snap.end));
                const histWidth = histX2 - histX1;
                if (!histWidth) continue;
                const histHeight = tickBucketsScale.bandwidth();
                for (let i = 0; i < snap.weightedPerf.length; i++) {
                    const perf = snap.weightedPerf[i];
                    ctx.fillStyle = histColor(perf);
                    ctx.fillRect(histX1, bucketYCoords[i]!, histWidth, histHeight);
                    rectCount++
                }
            }
        }
        console.timeEnd('drawing canvas heatmap');
        console.log('Canvas heatmap finished drawing:', { lifespanCount, rectCount });
    }
    drawCanvasHeatmap();


    const drawPlayersLine = (
        perfHistGSel: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>,
        data: PerfSnapType,
        snapIndex: number,
    ) => {
        const histX = timeScale(data.start);
        const histWidth = timeScale(data.end) - timeScale(data.start);
        perfHistGSel.selectAll('rect')
            .data(data.weightedPerf)
            .join('rect')
            .attr('x', histX)
            .attr('y', (d, i) => bucketYCoords[i]!)
            .attr('width', histWidth)
            .attr('height', tickBucketsScale.bandwidth())
            .attr('fill', d => histColor(d))
    }

    const drawLifespan = (
        lifespanGSel: d3.Selection<d3.BaseType | SVGGElement, PerfLifeSpanType, SVGSVGElement, unknown>
    ) => {
        const getLifespanStart = (d: PerfLifeSpanType) => (d.bootTime)
            ? timeScale(d.bootTime)
            : timeScale(d.log[0].start);
        const getLifespanEnd = (d: PerfLifeSpanType) => (d.closeTime)
            ? timeScale(d.closeTime)
            : timeScale(d.log.at(-1)!.end);

        //FIXME: optimization
        // const { bootTime, closeTime, log } = lifespanGSel.datum()!;
        // const lifespanStartX = bootTime ? timeScale(bootTime) : timeScale(log[0].start);
        // const lifespanEndX = closeTime ? timeScale(closeTime) : timeScale(log[0].end);
        // const lifespanWidth = lifespanEndX - lifespanStartX;
        // console.log({ lifespanStartX, lifespanEndX, lifespanWidth });
        // if (lifespanWidth < 5) return;

        //Background
        lifespanGSel.append('rect')
            .attr('class', 'bg')
            .attr('x', getLifespanStart)
            .attr('y', margins.top)
            .attr('y', margins.top)
            .attr('width', (d, i) => getLifespanEnd(d) - getLifespanStart(d))
            .attr('height', 5)
            .attr('fill', d => createRandomHslColor());
        // .attr('height', drawableAreaHeight)
        // .attr('fill', 'rgba(0, 0, 0, 0.25)');

        //Player lines
        const playerLineGenerator = d3.line<PerfSnapType>(
            (d) => timeScale(d.end),
            (d) => playersScale(d.players),
        );
        // const playerLineGenerator = () => 1
        lifespanGSel.append('path')
            .each((d, i, nodes) => {
                d3.select(nodes[i])
                    .attr("fill", "none")
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke", "black")
                    .attr("stroke-width", 6)
                    .attr('d', playerLineGenerator(d.log));
            })
        lifespanGSel.append('path')
            .each((d, i, nodes) => {
                d3.select(nodes[i])
                    .attr("fill", "none")
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke", "rgb(204, 203, 203)")
                    .attr("stroke-width", 2)
                    .attr('d', playerLineGenerator(d.log));
            });
    }

    // Drawing the lifespans
    console.time('drawing svg stuff');
    svg.selectAll('g.lifespan')
        .data(lifespans)
        .join('g')
        .attr('class', 'lifespan')
        .call(drawLifespan);
    console.timeEnd('drawing svg stuff');


    // const referenceY = playersScale(45);
    // svg.append('line')
    //     .attr('x1', timeScale.range()[0])
    //     .attr('y1', referenceY)
    //     .attr('x2', timeScale.range()[1])
    //     .attr('y2', referenceY)
    //     .attr('stroke', 'red')
    //     .attr('stroke-width', 2);
}
