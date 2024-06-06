import * as d3 from 'd3';
import { PerfLifeSpanType, PerfSnapType } from './chartingUtils';
import { createRandomHslColor, tsToLocaleDateTime } from '@/lib/utils';
import humanizeDuration from 'humanize-duration';


//Helpers
const translate = (x: number, y: number) => `translate(${x}, ${y})`;

type drawFullPerfChartProps = {
    svgRef: SVGSVGElement;
    size: {
        width: number;
        height: number;
    };
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    boundaries: string[];
    dataStart: Date;
    dataEnd: Date;
    lifespans: PerfLifeSpanType[];
};

export default function drawFullPerfChart({
    svgRef,
    size: { width, height },
    margins,
    boundaries,
    dataStart,
    dataEnd,
    lifespans,
}: drawFullPerfChartProps) {
    // FIXME: DEBUG Clear SVG
    console.clear();
    d3.select(svgRef).selectAll("*").remove();

    const svg = d3.select(svgRef);

    // X Axis - time
    const timeScale = d3.scaleTime()
        .domain([dataStart, dataEnd])
        .range([margins.left, width - margins.right]);

    const xAxis = d3.axisBottom(timeScale);
    svg.append("g")
        .attr("transform", translate(0, height - margins.bottom))
        // .attr("class", 'axis x-axis') //FIXME: e adicionei esse x-axis pra poder selecionar depois
        .call(xAxis);


    // Y Right Axis - Tick Times
    const tickBucketsScale = d3.scaleBand()
        .domain(boundaries)
        .range([height - margins.bottom, margins.top]);
    const bucketYCoords = boundaries.map(b => tickBucketsScale(b)!);
    const tickBucketsAxis = d3.axisRight(tickBucketsScale);
    svg.append("g")
        // .attr("id", "tickBucketsAxis")
        // .attr("class", "axis")
        .attr("transform", translate(width - margins.right, 0))
        .call(tickBucketsAxis);

    //Chart Area Background
    const bgColor = '#2A2A2A';
    svg.append('rect')
        .attr('x', margins.left)
        .attr('y', margins.top)
        .attr('width', width - margins.right - margins.left)
        .attr('height', height - margins.top - margins.bottom)
        .attr('fill', bgColor)

    const drawableAreaHeight = height - margins.top - margins.bottom;
    const drawableAreaWidth = width - margins.left - margins.right;
    const histColor = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, 1]);


    // console.clear();
    // console.log('===================================');
    // console.log('===================================');
    // const testScale = d3.scaleBand()
    //     .domain(boundaries)
    //     .range([height - margins.bottom, margins.top]);

    // const blocksWidth = (drawableAreaWidth / 15);
    // for (let i = 0; i < boundaries.length; i++) {
    //     svg.append('rect')
    //         .attr('x', margins.left + i * blocksWidth)
    //         .attr('y', testScale(boundaries[i])!)
    //         .attr('width', blocksWidth)
    //         .attr('height', testScale.bandwidth())
    //         .attr('fill', createRandomHslColor(0.25));

    //     svg.append('text')
    //         .text(i)
    //         .attr('x', margins.left + i * blocksWidth)
    //         .attr('y', testScale(boundaries[i])!)
    //         .attr('fill', 'red')
    //         .attr('text-anchor', 'start')
    //         .attr('dominant-baseline', 'hanging')
    // }
    // console.log('===================================');
    // console.log('===================================');
    // return;









    const drawPerfHistogram = (
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
            .attr('y', height - margins.bottom)
            .attr('width', (d, i) => getLifespanEnd(d) - getLifespanStart(d))
            // .on('mouseover', (ev, d) => {
            //     const timeStart = (d.bootTime) ? d.bootTime : d.log[0].start;
            //     const timeEnd = (d.closeTime) ? d.closeTime : d.log.at(-1)!.end;
            //     console.log(`From ${timeStart} to ${timeEnd}`);
            //     console.log('Duration', humanizeDuration(timeEnd.getTime() - timeStart.getTime()));
            // })
            // .attr('height', drawableAreaHeight)
            // .attr('fill', 'rgba(0, 0, 0, 0.25)')
            .attr('height', 25)
            .attr('fill', d => createRandomHslColor(0.25));


        //Histogram group + call
        lifespanGSel.append('g')
            .attr('class', 'snaps')
            .selectAll('rect')
            .data(d => d.log)
            .join('g')
            .attr('class', 'histo')
            // .attr('data-time', d => tsToLocaleDateTime(d.end.getTime()/1000))
            .each((d, i, nodes) => {
                const snapG = d3.select(nodes[i])
                    .call(drawPerfHistogram, d, i);
            });


    }


    // Drawing the lifespans
    svg.selectAll('g.lifespan')
        .data(lifespans)
        .join('g')
        .attr('class', 'lifespan')
        .call(drawLifespan);
}
