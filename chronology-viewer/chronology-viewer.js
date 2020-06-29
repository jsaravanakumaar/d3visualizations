if (!window.kgs) {
	kgs = {};
}

if (!kgs.widget) {
	kgs.widget = {};
}

'use strict';

kgs.widget.ChronologyViewer = (function (d3) {
	function Generator(config) {
		function createScaleForType(type) {
			if (type === 1)
				return d3.scaleLinear();
			else if (type === 2)
				return d3.scaleLog();
			else if (type === 3)
				return d3.scaleSqrt();
			else if (type === 4)
				return d3.scaleOrdinal();
			else if (type === 5)
				return d3.scaleTime().range([0, daWidth]);
        }

        const bisectYear = d3.bisector(([year]) => year).left;

        function valueAt(values, year) {
            const i = bisectYear(values, year, 0, values.length - 1);
            const a = values[i];
            if (i > 0) {
                const b = values[i - 1];
                const t = (year - a[0]) / (b[0] - a[0]);
                return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
        }
        
        const containerId = config.container.id;
		const width = (config.container.width && parseInt(config.container.width, 10)) || screen.availWidth;
        const height = (config.container.height && parseInt(config.container.height, 10)) || screen.availHeight;

		const margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

		if (config.margin) {
			margin.top = (config.margin.top && parseInt(config.margin.top, 10)) || 10;
			margin.right = (config.margin.right && parseInt(config.margin.right, 10)) || 10;
			margin.bottom = (config.margin.bottom && parseInt(config.margin.bottom, 10)) || 10;
			margin.left = (config.margin.left && parseInt(config.margin.left, 10)) || 10;
		}
		
		const daWidth = width - margin.right - margin.left;
        const daHeight = height - margin.top - margin.bottom;
        const xBinding = config.bindings.x;
        const yBinding = config.bindings.y;
        const colorBinding = config.bindings.color;
        const radiusBinding = config.bindings.radius;
        const xScale = createScaleForType(config.scale.x && parseInt(config.scale.x, 10) || 2).range([margin.left, width - margin.right]).domain([200, 1e5]);
        const yScale = createScaleForType(config.scale.y && parseInt(config.scale.y, 10) || 1).range([height - margin.bottom, margin.top]).domain([14, 86]);
        const colorScale = createScaleForType(config.scale.color && parseInt(config.scale.color, 10) || 4).range(d3.schemeCategory10);
        const radiusScale = createScaleForType(config.scale.radius && parseInt(config.scale.radius, 10) || 3).range([0, width / 24]).domain([0, 5e8]);

        const xAxis = g => g.attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale).ticks(width / 80, ","))
            .call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("x", width - margin.right)
                .attr("y", margin.bottom - 2)
                .style("fill", "currentColor")
                .attr("text-anchor", "end")
                .text("Income per capita (dollars)"));

        const yAxis = g => g.attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale))
            .call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("x", -margin.left)
                .attr("y", 10)
                .style("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("Life expectancy (years)"));

        const grid = g => g.style("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .call(g => g.append("g")
                .selectAll("line")
                .data(xScale.ticks())
                .join("line")
                    .attr("x1", d => 0.5 + xScale(d))
                    .attr("x2", d => 0.5 + xScale(d))
                    .attr("y1", margin.top)
                    .attr("y2", height - margin.bottom))
            .call(g => g.append("g")
                .selectAll("line")
                .data(yScale.ticks())
                .join("line")
                    .attr("y1", d => 0.5 + yScale(d))
                    .attr("y2", d => 0.5 + yScale(d))
                    .attr("x1", margin.left)
                    .attr("x2", width - margin.right));

        const svg = d3.select(containerId)
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("class", "chronology-viewer")
            .attr("width", width)
            .attr("height", height);

        let circle = undefined;
  
        svg.append("g")
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        svg.append("g")
            .call(grid);

        d3.select(containerId)
            .append("div")
            .append("text")
            .text("update")
            .on("click", updateChart);

        let tmpData = [];
        let counter = 0;

        function updateChart(e) {
            let intHandle = setInterval(function() {
                _update(tmpData, (1800 + ++counter));
                if (counter >= tmpData.length) {
                    counter = 0;
                    stopChart();
                }
            }, 150);
            
            function stopChart() {
                clearInterval(intHandle);
            }
        }

        function _render(data) {
            tmpData = data;
            colorScale.domain(data.map(d => d[colorBinding]));

            function dataAt(year) {
                return data.map(d => ({
                    name: d.name,
                    region: d.region,
                    income: valueAt(d[xBinding], year),
                    population: valueAt(d[radiusBinding], year),
                    lifeExpectancy: valueAt(d[yBinding], year)
                }));
            }

            circle = svg.append("g")
                .attr("stroke", "black")
                .selectAll("circle")
                .data(dataAt(1800), d => d.name)
                .join("circle")
                    .sort((a, b) => d3.descending(a[radiusBinding], b[radiusBinding]))
                    .attr("cx", d => xScale(d[xBinding]))
                    .attr("cy", d => yScale(d[yBinding]))
                    .attr("r", d => radiusScale(d[radiusBinding]))
                    .attr("fill", d => colorScale(d[colorBinding]))
                    .call(circle => circle.append("title")
                        .text(d => [d.name, d[colorBinding], ].join("\n")));
        }

        function _update(data, year) {
            function dataAt(year) {
                return data.map(d => ({
                    name: d.name,
                    region: d.region,
                    income: valueAt(d[xBinding], year),
                    population: valueAt(d[radiusBinding], year),
                    lifeExpectancy: valueAt(d[yBinding], year)
                }));
            }

            circle.data(dataAt(year), d => d.name)
                .sort((a, b) => d3.descending(a[radiusBinding], b[radiusBinding]))
                .attr("cx", d => xScale(d[xBinding]))
                .attr("cy", d => yScale(d[yBinding]))
                .attr("r", d => radiusScale(d[radiusBinding]));
        }

		function graph() {
			return {	
				render: function (data) {
					_render(data);
					return graph;
				},
				update: function (data) {
                    _update(data);
					return graph;
                },
                moveBrush: function (point) {
                    _moveBrush(point);
                    return graph;
                }
			};
		}
		
		return {
			graph: graph
		};
	}
		
	return {Generator: Generator};
})(d3);	