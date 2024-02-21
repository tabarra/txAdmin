const translate = (x, y) => {
    return `translate(${x}, ${y})`;
};

const clientsToMargin = (maxClients) => {
    //each char is about 5px
    return 12 + (maxClients.toString().length * 5);
};

const yLabels = ['5 ms', '10 ms', '25 ms', '50 ms', '75 ms', '100 ms', '250 ms', '500 ms', '750 ms', '1.0 s', '2.5 s', '5.0 s', '7.5 s', '10 s', '+Inf'];


export const drawHeatmap = (d3Container, perfData, options = {}) => {
    //Dynamic label interval size
    // got the points manually, plotted to https://www.geogebra.org/graphing
    // then made a function with a slider to help me match the best fitting one
    const tickIntervalMod = Math.max(
        15,
        Math.ceil(55 - (d3Container.offsetWidth * 0.051))
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
            c: snap.clients,
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
            });
        }

        //Process buckets
        for (let bucketIndex = 0; bucketIndex < 15; bucketIndex++) {
            const freq = (typeof snap.buckets[bucketIndex] == 'number') ? snap.buckets[bucketIndex] : 0;
            snapBuckets.push({
                x: snapIndex,
                y: bucketIndex,
                freq: freq
            });
        }
    }
    const maxClients = d3.max(snapClients.map(t => t.c));

    //Options
    if (typeof options.margin == 'undefined') options.margin = {};
    const margin = {
        top: options.margin.top || 5,
        right: options.margin.right || 45,
        bottom: options.margin.bottom || 20,
        left: options.margin.left || clientsToMargin(maxClients)
    };
    const height = options.height || 500;
    const colorScheme = options.colorScheme || d3.interpolateViridis;


    //Macro drawing stuff
    const width = d3Container.offsetWidth;
    const color = d3.scaleSequential(colorScheme)
        .domain([0, 1]);
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);
    const bgColor = options.bgColor || d3.color(color(0)).darker(1.35);


    // X Axis - Time
    const timeScale = d3.scaleBand()
        .domain(d3.range(perfData.length))
        .range([margin.left, width - margin.right]);
    const timeAxis = d3.axisBottom(timeScale)
        .tickValues(snapTimes.map(t => t.x))
        .tickFormat((d, i) => snapTimes[i].t);
    svg.append('g')
        .attr("id", "timeAxis")
        .attr("transform", translate(0, height - margin.bottom))
        .attr("id", "x-axis")
        .attr("class", "axis")
        .call(timeAxis);


    // Y Axis - Tick Times
    const tickBucketsScale = d3.scaleBand()
        .domain(d3.range(yLabels.length))
        .range([height - margin.bottom, margin.top]);
    const tickBucketsAxis = d3.axisRight(tickBucketsScale)
        .tickFormat((d, i) => `${yLabels[i]}`);
    svg.append("g")
        .attr("id", "tickBucketsAxis")
        .attr("class", "axis")
        .attr("transform", translate(width - margin.right - 3, 0))
        .call(tickBucketsAxis);


    //Background
    svg.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.right - margin.left)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', bgColor)
        .attr('stroke', bgColor);


    // Drawing the Heatmap
    const heatmap = svg.append("g")
        .attr("id", "heatmap")
        .selectAll('rect')
        .data(snapBuckets)
        .enter()
        .append('rect')
        .filter(d => (typeof d.freq == 'number' && d.freq > 0))
        .attr('x', (d, i) => timeScale(d.x))
        .attr('y', (d, i) => tickBucketsScale(d.y))
        .attr('width', timeScale.bandwidth())
        .attr('height', tickBucketsScale.bandwidth())
        .attr('fill', d => color(d.freq))
        .attr('stroke', d => color(d.freq));


    // Y2 Axis - Player count
    const y2Padding = Math.round(tickBucketsScale.bandwidth() / 2);
    const clientsScale = d3.scaleLinear()
        .domain([0, maxClients])
        .range([height - margin.bottom - y2Padding, margin.top + y2Padding]);

    const clientsAxis = d3.axisLeft(clientsScale)
        .tickFormat(t => t)
        .tickValues((maxClients > 7) ? null : d3.range(maxClients + 1));
    svg.append("g")
        .attr("id", "clientAxis")
        .attr("class", "axis")
        .attr("transform", translate(margin.left - 1.5, 0))
        .call(clientsAxis);

    const clientsLine = d3.line()
        .defined(d => !isNaN(d.c))
        .x(d => timeScale(d.x) + 2) // very small offset
        .y(d => clientsScale(d.c));
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

    // Horizontal line on the max client count
    // playerLineGroup.append('line')
    //     .style("stroke", "dodgerblue")  // dodgerblue maybe
    //     .attr("stroke-dasharray", 6)
    //     .attr("y1", clientsScale(maxClients))
    //     .attr("y2", clientsScale(maxClients))
    //     .attr("x1", margin.left) 
    //     .attr("x2", width - margin.right)


    // Skip lines
    svg.append("g")
        .attr("id", "skipLines")
        .selectAll(".link")
        .data(snapSkips)
        .enter()
        .append('line')
        .style("stroke", "gold")  // dodgerblue maybe
        .attr("stroke-dasharray", 6)
        .attr("x1", (d) => timeScale(d))
        .attr("x2", (d) => timeScale(d))
        .attr("y1", height - margin.bottom)
        .attr("y2", margin.top);

    d3Container.innerHTML = '';
    d3Container.append(svg.node());

    return heatmap._groups[0].length + 1;
};
