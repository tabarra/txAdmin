import * as d3 from 'd3';
import { formatTickBoundary } from './chartingUtils';
import { createRandomHslColor } from '@/lib/utils';

type SizeType = {
    width: number;
    height: number;
};
type MarginsType = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};


const translate = (x: number, y: number) => {
    return `translate(${x}, ${y})`;
};

export const boundaries = [0.001, 0.002, 0.004, 0.006, 0.008, 0.010, 0.015, 0.020, 0.030, 0.050, 0.070, 0.100, 0.150, 0.250, '+Inf'];
export const boundariesLabels = boundaries.map(formatTickBoundary);
export const exampleData = [
    {
        ts: new Date('2024-05-31T00:00:00.000Z'),
    },
    {
        ts: new Date('2024-06-01T00:00:00.000Z'),
    },
    {
        ts: new Date('2024-06-02T00:00:00.000Z'),
    },
    {
        ts: new Date('2024-06-03T00:00:00.000Z'),
    },
];


export default function drawFullPerfChart(svgRef: SVGSVGElement, { width, height }: SizeType, margins: MarginsType) {
    d3.select(svgRef).selectAll("*").remove(); // FIXME: DEBUG Clear SVG

    const svg = d3.select(svgRef);
    console.log(svg, Math.random().toString(36).substring(2, 15));

    console.log(exampleData);

    // X Axis - time
    const timeScale = d3.scaleTime()
        //FIXME: calculate dynamically
        .domain([exampleData[0].ts, new Date()])
        .range([margins.left, width - margins.right]);

    const xAxis = d3.axisBottom(timeScale);
    svg.append("g")
        .attr("transform", translate(0, height - margins.bottom))
        .attr("class", 'axis x-axis') //FIXME: e adicionei esse x-axis pra poder selecionar depois
        .call(xAxis);


    // Y Right Axis - Tick Times
    const tickBucketsScale = d3.scaleBand()
        .domain(boundariesLabels)
        .range([height - margins.bottom, margins.top]);
    const tickBucketsAxis = d3.axisRight(tickBucketsScale)
        .tickFormat((d, i) => boundariesLabels[i]);
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


    // Drawing the Heatmap
    const heatmap = svg.append("g")
        .attr("id", "heatmap")
        .selectAll('rect')
        .data(exampleData)
        .enter()
        .append('rect')
        .attr('x', (d, i) => timeScale(d.ts))
        .attr('data-idk', (d, i) => d.ts.constructor.name)
        .attr('y', margins.top)
        .attr("fill", createRandomHslColor())
        .attr("width", 20)
        .attr('height', height - margins.top - margins.bottom)
}
