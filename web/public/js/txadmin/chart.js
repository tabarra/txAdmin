const translate = (x, y) => {
    return `translate(${x}, ${y})`;
};

//FIXME: remove this
// const yLabels = ['0.005', '0.010', '0.025', '0.050', '0.075', '0.100', '0.250', '0.500', '0.750', '1.000', '2.500', '5.000', '7.500', '10.000', '+Inf'];
const yLabels = ['5 μs', '10 μs', '25 μs', '50 μs', '75 μs', '100 μs', '250 μs', '500 μs', '750 μs', '1.0 ms', '2.5 ms', '5.0 ms', '7.5 ms', '10 ms', '+Inf'];


const drawHeatmap = (d3Container, perfData, options = {}) => {
    //Options
    if (typeof options.margin == 'undefined') options.margin = {}
    const margin = {
        top: options.margin.top || 5,
        right: options.margin.right || 45,
        bottom: options.margin.bottom || 20,
        left: options.margin.left || 27
    };
    const height = options.height || 340;
    const colorScheme = options.colorScheme || d3.interpolateInferno;

    //TODO: make it responsive with screen size
    const tickIntervalMod = Math.min(
        15,
        Math.ceil(perfData.length / 20)
    );

    //Flatten data
    const snapTimes = [];
    const snapAvgTickTimes = [];
    const snapClients = [];
    const snapBuckets = [];
    const snapSkips = [];
    for (let snapIndex = 0; snapIndex < perfData.length; snapIndex++) {
        const snap = perfData[snapIndex];
        snapAvgTickTimes.push(snap.avgTime);
        snapClients.push({
            x: snapIndex,
            c: snap.clients
        });

        //Process skips
        if (snap.skipped) {
            snapSkips.push(snapIndex);
        }

        //Process times
        const time = new Date(snap.ts);
        if (snapIndex % tickIntervalMod == 0) {
            const hours = String(time.getHours()).padStart(2, "0");
            const minutes = String(time.getMinutes()).padStart(2, "0");
            snapTimes.push({
                x: snapIndex,
                t: `${hours}:${minutes}`
            })
        }

        //Process buckets
        for (let bucketIndex = 0; bucketIndex < 15; bucketIndex++) {
            const freq = (typeof snap.buckets[bucketIndex] == 'number') ? snap.buckets[bucketIndex] : 0
            snapBuckets.push({
                x: snapIndex,
                y: bucketIndex,
                freq: freq
            })
        }
    }


    //Macro drawing stuff
    const width = d3Container.offsetWidth;
    const color = d3.scaleSequential(colorScheme)
        .domain([0, 1])
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);


    // X Axis - Time
    const timeScale = d3.scaleBand()
        .domain(d3.range(perfData.length))
        .range([margin.left, width - margin.right])
    const timeAxis = d3.axisBottom(timeScale)
        .tickValues(snapTimes.map(t => t.x))
        .tickFormat((d, i) => snapTimes[i].t)
    svg.append('g')
        .attr("id", "timeAxis")
        .attr("transform", translate(0, height - margin.bottom))
        .attr("id", "x-axis")
        .attr("class", "axis")
        .call(timeAxis);


    // Y Axis - Tick Times
    const tickBucketsScale = d3.scaleBand()
        .domain(d3.range(yLabels.length))
        .range([height - margin.bottom, margin.top])
    const tickBucketsAxis = d3.axisRight(tickBucketsScale)
        .tickFormat((d, i) => `${yLabels[i]}`)
    svg.append("g")
        .attr("id", "tickBucketsAxis")
        .attr("class", "axis")
        .attr("transform", translate(width - margin.right - 3, 0))
        .call(tickBucketsAxis);


    // Drawing the Heatmap
    svg.append("g")
        .attr("id", "heatmap")
        .selectAll('rect')
        .data(snapBuckets)
        .enter()
        .append('rect')
        .filter(d => typeof d.freq == 'number')
        .attr('x', (d, i) => timeScale(d.x))
        .attr('y', (d, i) => tickBucketsScale(d.y))
        .attr('width', timeScale.bandwidth())
        .attr('height', tickBucketsScale.bandwidth())
        .attr('fill', d => color(d.freq))
        .attr('stroke', d => color(d.freq))


    // Y2 Axis - Player count
    const y2Padding = Math.round(tickBucketsScale.bandwidth() / 2);
    const maxClients = d3.max(snapClients.map(t => t.c));
    const clientsScale = d3.scaleLinear()
        .domain([0, maxClients])
        .range([height - margin.bottom - y2Padding, margin.top + y2Padding]);

    const clientsAxis = d3.axisLeft(clientsScale)
        .tickFormat(t => t)
        .tickValues((maxClients > 7)? null : d3.range(maxClients+1))
    svg.append("g")
        .attr("id", "clientAxis")
        .attr("class", "axis")
        .attr("transform", translate(margin.left - 1.5, 0))
        .call(clientsAxis);

    const clientsLine = d3.line()
        .defined(d => !isNaN(d.c))
        .x(d => timeScale(d.x) + 2) // very small offset
        .y(d => clientsScale(d.c))
    const playerLineGroup = svg.append("g")
        .attr("id", "clientsLine");

    playerLineGroup.append("path")
        .datum(snapClients)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 6)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", clientsLine);
    playerLineGroup.append("path")
        .datum(snapClients)
        .attr("fill", "none")
        .attr("stroke", " rgb(204, 203, 203)")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", clientsLine);


    // Skip lines
    svg.append("g")
        .attr("id", "skipLines")
        .selectAll(".link")
        .data(snapSkips)
        .enter()
        .append('line')
        .style("stroke", "gold")  // dodgerblue maybe
        .attr("stroke-dasharray", 6)
        .attr("x1", (d) => timeScale(d))     // x position of the first end of the line
        .attr("x2", (d) => timeScale(d))     // x position of the second end of the line
        .attr("y1", height - margin.bottom)      // y position of the first end of the line
        .attr("y2", margin.top);    // y position of the second end of the line

    d3Container.innerHTML = '';
    d3Container.append(svg.node());
}


export { drawHeatmap };
