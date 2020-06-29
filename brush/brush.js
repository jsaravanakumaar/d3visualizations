if (!window.kgs) {
	kgs = {};
}

if (!kgs.widget) {
	kgs.widget = {};
}
'use strict';

kgs.widget.Brush = (function (d3) {
	function Generator(config) {
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
        const xBindinig = config.bindings.x;
        const formatBinding = config.bindings.format;

        var parseDate = d3.timeParse(formatBinding);
        
        const xScale = d3.scaleTime().rangeRound([0, daWidth]);
        const brush = d3.brushX().extent([[0, 0], [daWidth, daHeight]])
                .on("end", brushEnded);

        const _translate = (x, y) => `translate(${x}, ${y})`;

        const svg = d3.select(containerId)
            .append("svg")
                .attr("width", width)
                .attr("height", height)
            .append("g")
                .attr("transform", _translate(margin.left, margin.top));
        
        const _render = function (data) {
            xScale.domain(d3.extent(data, d => parseDate(d[xBindinig])));

            svg.append("g")
                .attr("class", "axis axis--grid")
                .attr("transform", _translate(0, daHeight))
                .call(d3.axisBottom(xScale)
                    .tickSize(-daHeight)
                    .tickFormat(function() { return null; })
                    )
            .selectAll(".tick")
                .classed("tick--minor", d => d.getYear());

            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", _translate(0, daHeight))
                .call(d3.axisBottom(xScale)
                    .ticks(d3.timeYear.every(2))
                    .tickSize(0, 0)
                    .tickPadding(0))
                .attr("text-anchor", null)
            .selectAll("text")
                .attr("x", 6)
                .attr("y", -16)
                .style("color", "#dddddd");

            svg.append("g")
                .attr("class", "brush")
                .call(brush)
                .selectAll("rect")
                    .attr("y", -6)
                    .attr("height", daHeight + 7);

        }

        function brushEnded() {
            if (!d3.event.sourceEvent) return;
            if (!d3.event.selection) return;

            let d0 = d3.event.selection.map(xScale.invert);
            let d1 = d0.map(d3.timeYear.round);

            if (d1[0] >= d1[1]) {
                d1[0] = d3.timeYear.floor(d0[0]);
                d1[1] = d3.timeYear.offset(d1[0]);
            }
            
            d3.select("g.brush").transition().call(brush.move, d1.map(xScale));
        }

        function _moveBrush(point) {
            svg.select("g.brush").transition().duration(1000).call(brush.move, point.map(xScale));
        }

		function graph() {
			return {	
				render: function (data) {
					_render(data);
					return graph;
				},
				update: function (data) {
                    console.error("Not yet implemented!");
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