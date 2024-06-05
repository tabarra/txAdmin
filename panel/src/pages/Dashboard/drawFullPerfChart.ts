import * as d3 from 'd3';
import { PerfLifeSpanType } from './chartingUtils';


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
    d3.select(svgRef).selectAll("*").remove(); // FIXME: DEBUG Clear SVG

    const svg = d3.select(svgRef);
    console.log(svg, Math.random().toString(36).substring(2, 15));


    // X Axis - time
    const timeScale = d3.scaleTime()
        .domain([dataStart, dataEnd])
        .range([margins.left, width - margins.right]);

    const xAxis = d3.axisBottom(timeScale);
    svg.append("g")
        .attr("transform", translate(0, height - margins.bottom))
        .attr("class", 'axis x-axis') //FIXME: e adicionei esse x-axis pra poder selecionar depois
        .call(xAxis);


    // Y Right Axis - Tick Times
    const tickBucketsScale = d3.scaleBand()
        .domain(boundaries)
        .range([height - margins.bottom, margins.top]);
    const tickBucketsAxis = d3.axisRight(tickBucketsScale)
    // .tickFormat((d, i) => boundariesLabels[i]);
    svg.append("g")
        .attr("id", "tickBucketsAxis")
        .attr("class", "axis")
        .attr("transform", translate(width - margins.right, 0))
        .call(tickBucketsAxis);


    // //Data
    // svg.selectAll("rect")
    //     .datum(exampleData)
    //     .enter()
    //     .append("rect")
    //     .attr("x", (d) => scaleX(d[0].ts))
    //     .attr("y", margins.top)
    //     .attr("width", 20)
    //     .attr("height", height - margins.bottom)
    //     .attr("fill", createRandomHslColor());


    //Chart Area Background
    const bgColor = '#2A2A2A';
    svg.append('rect')
        .attr('x', margins.left)
        .attr('y', margins.top)
        .attr('width', width - margins.right - margins.left)
        .attr('height', height - margins.top - margins.bottom)
        .attr('fill', bgColor)

    const drawLifespan = (selection: d3.Selection<d3.EnterElement, PerfLifeSpanType, SVGGElement, unknown>) => {
        console.log('drawLifespan', selection);
    }


    // Drawing the Heatmap
    const heatmap = svg.append("g")
        .attr("id", "heatmap")
        .selectAll('rect')
        .data(lifespans)
        .enter()
        .call(drawLifespan);


    // .append('rect')
    // .attr('x', (d, i) => timeScale(d.ts))
    // .attr('data-idk', (d, i) => d.ts.constructor.name)
    // .attr('y', margins.top)
    // .attr("fill", createRandomHslColor())
    // .attr("width", 20)
    // .attr('height', height - margins.top - margins.bottom)
}
