if (!window.kgs) {
	kgs = {};
}

if (!kgs.widget) {
	kgs.widget = {};
}
'use strict';

kgs.widget.SteppedPieChart = (function (d3) {
	function Generator(config) {
        const containerId = config.container.id;
		const width = (config.container.width && parseInt(config.container.width, 10)) || screen.availWidth;
        const height = (config.container.height && parseInt(config.container.height, 10)) || screen.availHeight;
        const containerRadius = config.container.radius && parseInt(config.container.radius, 10) || (Math.min(width, height) - 1) / 2;
        
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
        const centerX = daWidth / 2;
        const centerY = daHeight / 2;

        let leftRadius = config.left && config.left.radius && parseInt(config.left.radius);
        let rightRadius = config.right && config.right.radius && parseInt(config.right.radius);
        const leftColors = config.left.colors; //["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff"];
        const rightColors = config.right.colors; //["#006d2c", "#2ca25f", "#66c2a4", "#b2e2e2", "#edf8fb"];

        const leftValueBindings = config.bindings.leftValueField;
        const rightValueBindings = config.bindings.rightValueField;

        const tooltipLeftConfig = {
            container : {
                id : "#tooltip-left",
                title: "Tooltip for",
                width: 200,
                height: 100
            },
            margin : {
                top : 2,
                right : 25,
                bottom : 5,
                left : 25
            },
            bindings: {
                labelField: "lable",
                valueField: "left",
                colorField: "color"
            }
        };

        const tooltipRightConfig = {
            container : {
                id : "#tooltip-right",
                title: "Tooltip for",
                width: 200,
                height: 100
            },
            margin : {
                top : 2,
                right : 25,
                bottom : 5,
                left : 25
            },
            bindings: {
                labelField: "lable",
                valueField: "right",
                colorField: "color"
            }
        };

        const leftPies = d3.pie()
            .value( d => d)
            .sort(null)
            .startAngle(Math.PI * 2)
            .endAngle(Math.PI * 1);
        
        let leftArc = d3.arc()
            .outerRadius(leftRadius)
            .innerRadius(0.1);
            
        const rightPies = d3.pie()
            .value( d => d)
            .sort(null)
            .startAngle(0)
            .endAngle(Math.PI);
        
        let rightArc = d3.arc()
            .outerRadius(rightRadius)
            .innerRadius(0.1);
        
        const translation = (x, y) => `translate(${x}, ${y})`;
        
        const svg = d3.select(containerId).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "stepped-pie-chart");

        let tooltipLeftDiv = d3.select(containerId).append("div")
            .attr("id", "tooltip-left")
            .attr("class", "tooltip-left")
            .style("opacity", 0);

        let tooltipRightDiv = d3.select(containerId).append("div")
            .attr("id", "tooltip-right")
            .attr("class", "tooltip-right")
            .style("opacity", 0);
        
        let tooltipLeft = kgs.widget.Tooltip.Generator(tooltipLeftConfig).graph();
        let tooltipRight = kgs.widget.Tooltip.Generator(tooltipRightConfig).graph();
    
        svg.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", containerRadius)
            .attr("class", "container-border")
            .attr("fill", "none")
            .attr("stroke", "#7f7f7f");

        const _populateTooltipData = function(field) {

        }

        const _render = function (data) {
            let leftData = [];
            let rightData = [];

            tooltipLeft.render(data);
            tooltipRight.render(data);

            for (let datum of data) {
                leftData.push(datum[leftValueBindings]);
                rightData.push(datum[rightValueBindings]);
            }

            svg.append("g")
                .attr("transform", translation(centerX, centerY))
                .attr("class", "left-g")
                .selectAll("path")
                .data(leftPies(leftData))
                .enter()
                .append("path")
                    .attr("class", "left-pies")
                    .attr("fill", (d, i) => leftColors[i])
                    .attr("d", leftArc);
            
            svg.append("g")
                .attr("transform", translation(centerX, centerY))
                .selectAll("left-cover")
                .data(leftPies([1]))
                .enter()
                .append("path")
                    .attr("class", "left-cover")
                    .attr("fill", (d, i) => leftColors[i])
                    .style("opacity", 1)
                    .attr("d", leftArc)
                    .on("mouseover", e => {
                        svg.selectAll(".left-cover").style("opacity", 0.1);
                        tooltipLeftDiv.transition(200).style("opacity", .9);
                        tooltipLeftDiv
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY) + "px");
                    })
                    .on("mouseout", e => {
                        svg.selectAll(".left-cover").style("opacity", 1);
                        tooltipLeftDiv.transition(200).style("opacity", 0);
                    });

            svg.append("g")
                .attr("transform", translation(centerX, centerY))
                .attr("class", "right-g")
                .selectAll("path")
                .data(rightPies(rightData))
                .enter()
                .append("path")
                    .attr("class", "right-pies")
                    .attr("fill", (d, i) => rightColors[i])
                    .attr("d", rightArc);
            
            svg.append("g")
                .attr("transform", translation(centerX, centerY))
                .selectAll("right-cover")
                .data(rightPies([1]))
                .enter()
                .append("path")
                    .attr("class", "right-cover")
                    .attr("fill", (d, i) => rightColors[i])
                    .style("opacity", 1)
                    .attr("d", rightArc)
                    .on("mouseover", e => {
                        svg.selectAll(".right-cover").style("opacity", 0.1);
                        tooltipRightDiv.transition(200).style("opacity", .9);
                        tooltipRightDiv
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY) + "px");
                    })
                    .on("mouseout", e => {
                        svg.selectAll(".right-cover").style("opacity", 1);
                        d3.selectAll("#right-tooltip").style("visibility", "hidden");

                        tooltipRightDiv.transition(200).style("opacity", 0);
                    });
        }

        const _updateLeftRadius = function(radius) {
            leftRadius = radius;
            leftArc.outerRadius(radius);
        }

        const _updateRightRadius = function(radius) {
            rightRadius = radius;
            rightArc.outerRadius(radius);
        }

        const _arcTweenLeft = function() {
            return function(d) {
                let interpolate = d3.interpolate(d.startAngle, d.endAngle);
                return function(t) {
                    d.endAngle = interpolate(t);

                    return leftArc(d);
                }
            }
        }

        const _arcTweenRight = function() {
            return function(d) {
                let interpolate = d3.interpolate(d.startAngle, d.endAngle);
                return function(t) {
                    d.endAngle = interpolate(t);

                    return rightArc(d);
                }
            }
        }

        const _update = function(data) {
            let leftData = [];
            let rightData = [];

            tooltipLeft.update(data);
            tooltipRight.update(data);

            for (let datum of data) {
                leftData.push(datum[leftValueBindings]);
                rightData.push(datum[rightValueBindings]);
            }

            let lPies = svg.select("g.left-g").selectAll("path.left-pies")
                .data(leftPies(leftData));

            lPies.exit()
                .transition().duration(1000)
                .style("opacity", 0)
                .remove();

            lPies.enter().append("path")
                .attr("class", "left-pies")
                .attr("fill", (d, i) => leftColors[i])
                .transition().duration(1000)
                .attrTween("d", _arcTweenLeft());

            lPies.attr("fill", (d, i) => leftColors[i])
                .transition().duration(1000)
                .attr("d", leftArc);

            svg.selectAll(".left-cover")
                .data(leftPies([1]))
                .transition().duration(1000)
                .attr("fill", (d, i) => leftColors[i])
                .attr("d", leftArc);
        
            let rPies = svg.select("g.right-g").selectAll("path.right-pies")
                .data(rightPies(rightData));

            rPies.exit().transition().duration(1000).style("opacity", 0).remove();

            rPies.enter().append("path")
                .attr("class", "right-pies")
                .attr("fill", (d, i) => rightColors[i])
                .transition().duration(1000)
                .attrTween("d", _arcTweenRight());
            
            rPies.attr("fill", (d, i) => rightColors[i])
                .transition().duration(1000)
                .attr("d", rightArc);

            svg.selectAll(".right-cover")
                .data(rightPies([1]))
                .transition().duration(1000)
                .attr("fill", (d, i) => rightColors[i])
                .attr("d", rightArc);
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
                updateLeftRadius: function(radius) {
                    _updateLeftRadius(radius);
                    return graph;
                },
                updateRightRadius: function(radius) {
                    _updateRightRadius(radius);
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