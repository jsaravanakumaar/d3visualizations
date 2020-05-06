if (!window.kgs) {
	window.kgs = {};
}

if (!window.kgs.widget) {
	window.kgs.widget = {};
}

kgs.widget.LineChart = (function (d3) {
	function Generator(config) {
		function scaleType(type) {
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

		const INVALID_CONFIG_MSG = "Invalid configuration provided to render chart!";
		const DURATION = 1000;
		const DEFAULT_CATAGORY = "defaultCategory";

		let containerId, width, height, bindingCategory, bindingX, bindingY, bindingColor, daHeight, daWidth;
		let lineChart, xScaleType, yScaleType, xAxisLine, yAxisLine, xAxisLabel, yAxisLabel, xAxis, yAxis;

		let margin = {
			top: 20,
			right: 30,
			bottom: 20,
			left: 30
		};

		const color = d3.scaleOrdinal(d3.schemeCategory10);
		let allXValues = [], allYValues = [], lcl, ucl, xAxisFormat, yAxisFormat, xAxisTicks = 0, yAxisTicks = 0, xTickerAngle = -90;

		if (!config.container) {
			throw Error(INVALID_CONFIG_MSG + "Please provide valid container object.");
		}

		if (!config.container.id) {
			throw Error(INVALID_CONFIG_MSG + "Please provide container id.");
		} else {
			containerId = config.container.id;
		}

		if (!config.container.width) {
			throw Error(INVALID_CONFIG_MSG + "Please provide container width.");
		} else {
			width = parseInt(config.container.width, 10);
			if (isNaN(width) || width < 100) {
				throw Error(INVALID_CONFIG_MSG + "Please provide valid width.");
			}
		}

		if (!config.container.height) {
			throw Error(INVALID_CONFIG_MSG + "Please provide container height.");
		} else {
			height = parseInt(config.container.height, 10);
			if (isNaN(height) || height < 100) {
				throw Error(INVALID_CONFIG_MSG + "Please provide valid height.");
			}
		}

		if (config.margin) {
			margin.top = parseInt(config.margin.top, 10);
			margin.right = parseInt(config.margin.right, 10);
			margin.bottom = parseInt(config.margin.bottom, 10);
			margin.left = parseInt(config.margin.left, 10);
		}

		//da - draw area
		daWidth = width - margin.right - margin.left;
		daHeight = height - margin.top - margin.bottom;

		if (!config.bindings) {
			throw Error(INVALID_CONFIG_MSG + "Please provide bindings.");
		}

		if (!config.bindings.category) {
			//In case of drawing one line, categor is optional.
			bindingCategory = DEFAULT_CATAGORY;
		} else {
			bindingCategory = config.bindings.category;
		}

		if (!config.bindings.x) {
			throw Error(INVALID_CONFIG_MSG + "Please provide bindings for x axis.");
		} else {
			bindingX = config.bindings.x;
		}

		if (!config.bindings.y) {
			throw Error(INVALID_CONFIG_MSG + "Please provide bindings for y axis.");
		} else {
			bindingY = config.bindings.y;
		}

		bindingColor = config.bindings.category;

		if (!config.scaling) {
			throw Error(INVALID_CONFIG_MSG + "Please provide scale for both axes.");
		}

		if (!config.scaling.x) {
			throw Error(INVALID_CONFIG_MSG + "Please provide scale for x axis.");
		}

		if (!config.scaling.y) {
			throw Error(INVALID_CONFIG_MSG + "Please provide scale for y axis.");
		}

		xAxisFormat = (config.scaleFormat && config.scaleFormat.x) || "";
		yAxisFormat = (config.scaleFormat && config.scaleFormat.y) || "";
		xAxisTicks = (config.ticks && config.ticks.x && config.ticks.x > 0 && config.ticks.x) || 0;
		yAxisTicks = (config.ticks && config.ticks.y && config.ticks.y > 0 && config.ticks.y) || 0;

		if (config.tickerAngle) {
			if (config.tickerAngle.x === 0) {
				xTickerAngle = 0;
			}
			if (config.tickerAngle.x) {
				if (isNaN(config.tickerAngle.x)) {
					xTickerAngle = -90;
				} else {
					xTickerAngle = parseFloat(config.tickerAngle.x);
				}
			}
		}

		if (!config.labels) {
			xAxisLabel = "";
			yAxisLabel = "";
		} else {
			xAxisLabel = config.labels.x || "";
			yAxisLabel = config.labels.y || "";
		}

		xScaleType = parseInt(config.scaling.x, 10);
		yScaleType = parseInt(config.scaling.y, 10);

		if (xScaleType === 4) {
			throw Error(INVALID_CONFIG_MSG + "X Axis scale cannot be ordinal.");
		}
		xScale = scaleType(xScaleType);
		
		if (!(yScaleType === 1 || yScaleType === 2 || yScaleType === 3)) {
			throw Error(INVALID_CONFIG_MSG + "Scaling for Y axis must be either linear, logarithmic or sqrt.");
		}
		yScale = scaleType(yScaleType).range([daHeight, 0]);

		chartNode = d3.select(containerId).node();

		lineChart = d3.select(containerId)
			.append("svg")
				.attr("class", "line-chart")
				.attr("width", width)
				.attr("height", height)
				.append("g")
					.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

		lineChart.append("text")
			.attr("class", "title")
			.attr("text-anchor", "middle")
			.attr("x", daWidth / 2)
			.attr("y", margin.top - 10)
			.text(" ");

		var line = d3.line()
			.curve(d3.curveCardinal)
			.x(function (d) { return xScale(d.parsedData); })
			.y(function (d) { return yScale(d[bindingY]); });

		var parseNo = function (datum) {
			if (isNaN(datum)) {
				throw new Error("Invalid number to parse!  Data: " + datum);
			}
			return datum;
		};

		var parseDate = function (datum) {
			return new Date(datum);
		};

		var parseDatum = config.scaling.x === 5 ? parseDate : parseNo;

		var _rangeFinder = function (allValues, factor) {
			if (!factor) {
				factor = 1;
			}
			var extents = [];
			extents.push(d3.extent(allValues));

			return [d3.min(extents, function (pair) {
				return pair[0];
			}) / factor,
			d3.max(extents, function (pair) {
				return pair[1];
			}) / factor];
		};

		function _fade(opacity) {
			return function (g, i) {
				lineChart.selectAll(".marker")
					.filter(function (f) {
						return f[bindingCategory] === g[bindingCategory];
					})
					.transition()
					.style("opacity", opacity);
			};
		}

		function _drawControlLimits() {
			var controlLimits = [];
			if (config.limits && config.limits.lower && !isNaN(config.limits.lower))
				controlLimits.push({ limit: "lcl", value: config.limits.lower });

			if (config.limits && config.limits.upper && !isNaN(config.limits.upper))
				controlLimits.push({ limit: "ucl", value: config.limits.upper });

			lineChart.selectAll(".cutoff-limit")
				.data(controlLimits)
				.enter()
				.append("line")
				.attr("class", function (d) {
					return "cutoff-limit " + d.limit;
				})
				.attr("x1", 0)
				.attr("y1", function (d) {
					return yScale(d.value);
				})
				.attr("x2", daWidth)
				.attr("y2", function (d) {
					return yScale(d.value);
				});
		}

		function _drawLines(lines) {
			lines.transition()
				.duration(DURATION)
				.attr("d", function (d) { return line(d); })
				.style("opacity", 1)
				.style("stroke", function (d) {
					return color(d[0][bindingColor]);
				});
		}

		function _drawMarkers(markers) {
			markers.transition()
				.duration(DURATION)
				.attr("cx", function (d, i) { return xScale(d.parsedData); })
				.attr("cy", function (d, i) { return yScale(d[bindingY]); })
				.attr("r", 4.5)
				.style("opacity", 0)
				.style("stroke", function (d) {
					return color(d[bindingColor]);
				});
		}

		function _drawAxesWithLabels() {
			xAxisLine = lineChart.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0, " + daHeight + ")")
				.call(xAxis)

			xAxisLine.append("text")
				.attr("class", "axis-label")
				.attr("x", daWidth)
				.attr("y", -10)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.style("font-size", ".8em")
				.style("fill", "#0f0f0")
				.text(xAxisLabel);

			yAxisLine = lineChart.append("g")
				.attr("class", "y axis")
				.attr("transform", "translate(0, 0)")
				.call(yAxis);

			yAxisLine.append("text")
				.attr("class", "axis-label")
				.attr("transform", "rotate(90)")
				.attr("y", -10)
				.attr("dy", ".71em")
				.style("text-anchor", "start")
				.text(yAxisLabel);
		}

		function xlabels(data) {
			if (xTickerAngle === 0) {
				xAxisLine.selectAll("text")
					.attr("dx", "-.0em")
					.attr("dy", ".6em")
					.style("text-anchor", "middle")
					.attr("transform", "rotate(0)");
			} else {
				xAxisLine.selectAll("text")
					.attr("dx", "-1.1em")
					.attr("dy", "-.6em")
					.style("text-anchor", "end")
					.attr("transform", "rotate(" + xTickerAngle + ")");
			}
		}

		function _processCategories(data) {
			var categories = {}, processedCategories = [];

			allXValues = [];
			allYValues = [];
			if (bindingCategory === DEFAULT_CATAGORY) {
				data.forEach(function (datum, index) {
					if (!categories[bindingCategory]) {
						categories[bindingCategory] = [];
					}

					datum.parsedData = parseDatum(datum[bindingX]);
					datum.bindCategory = DEFAULT_CATAGORY;
					allXValues.push(datum.parsedData);
					allYValues.push(datum[bindingY]);
					categories[bindingCategory].push(datum);
				});
			} else {
				data.forEach(function (datum, index) {
					if (!categories[datum[bindingCategory]]) {
						categories[datum[bindingCategory]] = [];
					}
					datum.parsedData = parseDatum(datum[bindingX]);
					allXValues.push(datum.parsedData);
					allYValues.push(datum[bindingY]);
					categories[datum[bindingCategory]].push(datum);
				});
			}

			Object.keys(categories).forEach(function (datum, index) {
				if (categories[datum].length > 1)
					processedCategories.push(categories[datum]);
			});

			return processedCategories;
		}

		function _renderOnNoData() {
			xScale.domain([0, 0]);
			yScale.domain([0, 0]);

			xAxis = d3.axisBottom(xScale);
			yAxis = d3.axisLeft(yScale);

			_drawAxesWithLabels();

			if (xAxisLine)
				xAxisLine.transition().duration(DURATION).call(xAxis);

			if (yAxisLine)
				yAxisLine.transition().duration(DURATION).call(yAxis);

			lineChart.selectAll(".category").data([]).exit().transition().duration(DURATION).remove();
			return;
		}

		function _distance(markerObj, mousePos) {
			return Math.sqrt(((mousePos[0] - xScale(markerObj.parsedData)) * (mousePos[0] - xScale(markerObj.parsedData))) + ((mousePos[1] - yScale(markerObj[bindingY])) * (mousePos[1] - yScale(markerObj[bindingY]))));
		}

		function _showNearestPoint(line, mousePos) {
			var xPoints = [];

			var nearerPoints = lineChart.selectAll(".marker")
				.filter(function (f, fi) {
					return line[bindingCategory] === f[bindingCategory];
				})
				.sort(function (a, b) {
					var aX = xScale(a.parsedData);
					var bX = xScale(b.parsedData);
					if (aX > bX) {
						return 1;
					} else if (aX < bX) {
						return -1;
					} else {
						return 0;
					}
				})
				.filter(function (f, fi) {
					xPoints.push({ "marker": f, "distance": xScale(f.parsedData) - mousePos[0] });
					return true;
				});

			for (var v = 1; v < xPoints.length; v++) {
				if (xPoints[v - 1].distance < 0 && xPoints[v].distance > 0)
					break;
			}

			var dist1 = _distance(xPoints[v - 1].marker, mousePos);
			var dist2 = _distance(xPoints[v].marker, mousePos);
			if (dist1 < dist2) {
				nearerPoints.filter(function (f, fi) {
					return fi === v - 1;
				}).style("opacity", 1);
			} else {
				nearerPoints.filter(function (f, fi) {
					return fi === v;
				}).style("opacity", 1);
			}
		}

		function _setXAxisFormat() {
			if (xAxisFormat) {
				if (config.scaling.x === 5) {
					xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat(xAxisFormat));
				}
				else if (config.scaling.x === 1 || config.scaling.x === 2 || config.scaling.x === 3) {
					xAxis = d3.axisBottom(xScale).tickFormat(d3.format(xAxisFormat));
				}
				else {
					xAxis = d3.axisBottom(xScale);
				}
			} else {
				xAxis = d3.axisBottom(xScale);
			}
		}

		function _setYAxisFormat() {
			if (yAxisFormat) {
				if (config.scaling.y === 5) {
					yAxis = d3.axisLeft(y).tickFormat(d3.timeFormat(yAxisFormat));
				}
				else if (config.scaling.y === 1 || config.scaling.y === 2 || config.scaling.y === 3) {
					yAxis = d3.axisLeft(yScale).tickFormat(d3.format(yAxisFormat));
				}
				else {
					yAxis = d3.axisLeft(yScale);
				}
			} else {
				yAxis = d3.axisLeft(yScale);
			}
		}

		function _render(data) {
			if (!data || data.length < 1) {
				_renderOnNoData();
				return;
			}

			if (config.container.title) {
				lineChart.select(".title").text(config.container.title);
			}

			var processedCategories = _processCategories(data);
			xScale.domain(_rangeFinder(allXValues));
			yScale.domain(_rangeFinder(allYValues));

			_setXAxisFormat();
			_setYAxisFormat();

			if (xAxisTicks > 0) {
				xAxis.ticks(allXValues.length < 10 ? xAxisTicks : 10); //D3's default tick count;
			}

			if (yAxisTicks > 0) {
				yAxis.ticks(allYValues.length < 10 ? yAxisTicks : 10); //D3's default tick count;
			}

			_drawAxesWithLabels();
			xlabels(allXValues);

			_drawControlLimits();

			if (processedCategories.length === 0) {
				_renderOnNoData();
				return;
			}

			var category = lineChart.selectAll(".category")
				.data(processedCategories, function (d, i) {
					return d[0][bindingCategory];
				})
				.enter()
				.append("g")
				.attr("class", "category");

			category.append("path")
				.attr("class", "line")
				.call(_drawLines)
				.on("mouseover", function (d, i) {
					d3.select(this)
						.style("stroke-width", "3.0");

					var pathNode = d3.select(this).node();
					var mousePos = d3.mouse(pathNode);
					_showNearestPoint(d[i], mousePos);
				})
				.on("mouseout", function (d, i) {
					d3.select(this)
						.style("stroke-width", "1.5");

					category.selectAll(".marker").style("opacity", 0);
				});

			category.append("text")
				.attr("class", "label")
				.attr("transform", function (d) {
					var index = d.length;
					return "translate(" + xScale(d[index - 1].parsedData) + ", " + yScale(d[index - 1][bindingY]) + ")";
				})
				.attr("x", -30)
				.attr("dy", ".35em")
				.style("text-anchor", "middle")
				.text(function (d, i) { return (bindingCategory === DEFAULT_CATAGORY ? '' : d[0][bindingCategory]); });

			category.selectAll(".marker")
				.data(function (d) { return d; }, function (d) {
					return d[bindingCategory] + "|" + d.parsedData + "|" + d[bindingY];
				})
				.enter()
				.append("circle")
				.attr("class", "marker")
				.call(_drawMarkers)
				.on("mouseover", function (d, i) {
					d3.select(this).style("opacity", 1);
				})
				.on("mouseout", function (d) {
					d3.select(this).style("opacity", 0);
				});
		}

		function _update(data) {
			if (!data || data.length < 1) {
				_renderOnNoData();
				return;
			}

			if (config.container.title) {
				lineChart.select(".title").text(config.container.title);
			}

			var processedCategories = _processCategories(data);
			if (processedCategories.length === 0) {
				_renderOnNoData();
				return;
			}

			xScale.domain(_rangeFinder(allXValues));
			yScale.domain(_rangeFinder(allYValues));

			_setXAxisFormat();
			_setYAxisFormat();

			if (xAxisTicks > 0) {
				xAxis.ticks(allXValues.length < 10 ? xAxisTicks : 10); //D3's default tick count;
			}

			if (yAxisTicks > 0) {
				yAxis.ticks(allYValues.length < 10 ? yAxisTicks : 10); //D3's default tick count;
			}

			xAxisLine.transition().duration(DURATION).call(xAxis);
			yAxisLine.transition().duration(DURATION).call(yAxis);

			xlabels(allXValues);

			xAxisTicks = lineChart.selectAll(".x.axis > g").sort(function (a, b) {
				if (a < b) {
					return -1;
				} else if (a === b) {
					return 0;
				} else {
					return 1;
				}
			});

			var category = lineChart.selectAll(".category")
				.data(processedCategories, function (d, i) {
					return d[0][bindingCategory];
				})
				.enter()
				.append("g")
				.attr("class", "category");

			category.append("path")
				.attr("class", "line")
				.call(_drawLines)
				.on("mouseover", function (d, i) {
					var pathNode = d3.select(this).node();
					var mousePos = d3.mouse(pathNode);

					d3.select(this)
						.style("stroke-width", "3.0");

					_showNearestPoint(d[i], mousePos);
				})
				.on("mouseout", function (d, i) {
					d3.select(this)
						.style("stroke-width", "1.5");

					category.selectAll(".marker").style("opacity", 0);
				})
				.on("click", function (d, i) {
					PubSub.publish("linechart-line-clicked", d);
				});

			category.append("text")
				.attr("class", "label")
				.attr("transform", function (d) {
					var index = d.length;
					return "translate(" + xScale(d[index - 1].parsedData) + ", " + yScale(d[index - 1][bindingY]) + ")";
				})
				.attr("x", 3)
				.attr("dy", ".35em")
				.text(function (d) { return (bindingCategory === DEFAULT_CATAGORY ? '' : d[0][bindingCategory]); });

			lineChart.selectAll(".line")
				.data(processedCategories, function (d, i) { return d[0][bindingCategory]; })
				.call(_drawLines);

			lineChart.selectAll(".category")
				.data(processedCategories, function (d, i) { return d[0][bindingCategory]; })
				.selectAll(".marker")
				.data(function (d) { return d; }, function (d) {
					return d[bindingCategory] + "|" + d.parsedData + "|" + d[bindingY];
				})
				.enter()
				.insert("circle", "g.category")
				.attr("class", "marker")
				.call(_drawMarkers)
				.on("mouseover", function (d, i) {
					d3.select(this).style("opacity", 1);
				})
				.on("mouseout", function (d) {
					d3.select(this).style("opacity", 0);
				});

			lineChart.selectAll(".category")
				.data(processedCategories, function (d, i) { return d[0][bindingCategory]; })
				.selectAll(".marker")
				.data(function (d) { return d; }, function (d) {
					return d[bindingCategory] + "|" + d.parsedData + "|" + d[bindingY];
				})
				.call(_drawMarkers);

			lineChart.selectAll(".label")
				.data(processedCategories, function (d, i) { return d[0][bindingCategory]; })
				.transition()
				.duration(DURATION)
				.attr("transform", function (d) {
					var index = d.length;
					return "translate(" + xScale(d[index - 1].parsedData) + ", " + yScale(d[index - 1][bindingY]) + ")";
				});

			lineChart.selectAll(".category")
				.data(processedCategories, function (d, i) { return d[0][bindingCategory]; })
				.exit()
				.transition()
				.duration(DURATION)
				.style("opacity", 0)
				.remove();

			lineChart.selectAll(".category")
				.data(processedCategories, function (d, i) { return d[0][bindingCategory]; })
				.selectAll(".marker")
				.data(function (d) { return d; }, function (d) {
					return d[bindingCategory] + "|" + d.parsedData + "|" + d[bindingY];
				})
				.exit()
				.transition()
				.duration(DURATION)
				.attr("opacity", 0)
				.remove();
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