if (!window.kgs) {
	kgs = {};
}
if (!kgs.widget) {
	kgs.widget = {};
}

'use strict';

kgs.widget.Tooltip = (function (d3) {
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

        const lableBinding = config.bindings.labelField;
        const valueBinding = config.bindings.valueField;
        const colorBinding = config.bindings.colorField;

        let tooltipSVG = d3.select(containerId)             
            .append("svg")
            .attr("id", "tooltip")
            .attr("class", "tooltip")
            .attr("width", width)
            .attr("height", height);
        
        let parentG = tooltipSVG.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
        
        function _render(data) {
            let ttItemG = parentG.selectAll("g")
                .data(data)
                .enter()
                .append("g");

            ttItemG.append("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y-4)
                .attr("r", 5)
                .attr("fill", d => d[colorBinding]);

            ttItemG.append("text")
				.attr("class", "title")
				.attr("text-anchor", "left")
				.attr("x", d => d.x + 20)
				.attr("y", d => d.y)
                .text(d => d[lableBinding]);
                
            ttItemG.append("text")
				.attr("class", "value")
				.attr("text-anchor", "left")
				.attr("x", d => d.x + 120)
				.attr("y", d => d.y)
				.text(d => d[valueBinding]);
        }

        function _update(data) {
            let ttItemG = parentG.selectAll("g")
                .remove()
                .exit()
                .data(data)
                .enter()
                .append("g");

            ttItemG.append("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y-4)
                .attr("r", 5)
                .attr("fill", d => d[colorBinding]);

            ttItemG.append("text")
				.attr("class", "title")
				.attr("text-anchor", "left")
				.attr("x", d => d.x + 20)
				.attr("y", d => d.y)
                .text(d => d[lableBinding]);
                
            ttItemG.append("text")
				.attr("class", "value")
				.attr("text-anchor", "left")
				.attr("x", d => d.x + 120)
				.attr("y", d => d.y)
				.text(d => d[valueBinding]);
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
                }
            };
        }

        return {
            graph: graph
        };
    }

    return { Generator: Generator };
})(d3);