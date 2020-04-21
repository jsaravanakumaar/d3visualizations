 if (!window.kgs) {
	kgs = {};
}
if (!kgs.widget) {
	kgs.widget = {};
}

kgs.widget.StackedColumnDonut = (function (d3) {
	function Generator(config) {
		function enableMouseEvents(){
			setTimeout(function() {
                let elem = document.getElementById(containerId);
                if (elem && elem.classList)
                    elem.classList.remove('no-mouse');
			}, DURATION);
		}
		
		function toRadian(angle) {
			return angle * Math.PI / 180;
        }
        
		const margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };
        const START_ANGLE = 60;
        const END_ANGLE = 300;
        const HACK_START_ANGLE = 300;
        const HACK_END_ANGLE = 420;
        const ROTATE_ANGLE = 270;
        const ROTATE_RADIAN = toRadian(ROTATE_ANGLE);
        const DURATION = 1000;
        const X = d3.scaleLinear().domain([START_ANGLE, END_ANGLE]).range([toRadian(START_ANGLE), toRadian(END_ANGLE)]);
        const HEAD_COLOR = d3.scaleOrdinal(d3["schemeCategory10"]);
        const H_PADDING = 19;
        const V_PADDING = 5;
        const APP_BOX_WIDTH = 60;
        const contributorsField = "contributors", contData = "data";
        const t = d3.transition().duration(DURATION).ease(d3.easeLinear);
		
        let appBoxHeight = 0, uniqueHeadData = {}, dataForSCChart = {}, toBeSortedHeadData = [],
            chordData = [], min = 0, max = 0, defs, apps, arcGroup, ribbons, 
            prevArcData = [], prevChordData = [], origData = [];
		
		const containerId = config.container.id;
		const width = (config.container.width && parseInt(config.container.width, 10)) || screen.availWidth;
		const height = (config.container.height && parseInt(config.container.height, 10)) || screen.availHeight;
		
		if (config.margin) {
			margin.top = (config.margin.top && parseInt(config.margin.top, 10)) || 10;
			margin.right = (config.margin.right && parseInt(config.margin.right, 10)) || 10;
			margin.bottom = (config.margin.bottom && parseInt(config.margin.bottom, 10)) || 10;
			margin.left = (config.margin.left && parseInt(config.margin.left, 10)) || 10;
		}
		
		const daWidth = width - margin.right - margin.left;
		const daHeight = height - margin.top - margin.bottom;
        const radius = Math.min(daWidth, daHeight) / 2;
        const innerRadius = radius * 0.54;
		const anchorPoint = [daWidth - radius, daHeight / 2];
        const level1 = config.bindings.level1;
        const level2 = config.bindings.level2;
        const level3 = config.bindings.level3;
        const value = config.bindings.value;
		
		const svg = d3.select(containerId)
			.append("svg")
			.attr("id", "stacked-column-donut")
			.attr("class", "stacked-column-donut")
			.attr("width", daWidth + margin.right + margin.left)
			.attr("height", daHeight + margin.top + margin.bottom);
		
		if (config.container.title) {
			svg.append("text")
				.attr("class", "title")
				.attr("text-anchor", "middle")
				.attr("x", svg.attr("width") / 2)
				.attr("y", 12)
				.text(config.container.title);
		}
		
		var arc = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(radius)
			.startAngle(function (d, i) {
				return d.startRad;
			})
			.endAngle(function (d, i) {
				return d.endRad;
			});
		
		var chord = d3.ribbon()
			.source(function (d) {
				return d.source;
			})
			.target(function (d) {
				return d.target;
			})
			.radius(function (d) {
				return d.radius;
			})
			.startAngle(function (d) {
				return d.startAngle;
			})
			.endAngle(function (d) {
				return d.endAngle;
			});
		
		function _hackToHideArc() {
			var hackData = {"startRad": toRadian(HACK_START_ANGLE), "endRad": toRadian(HACK_END_ANGLE)};
			var hackArc = d3.arc()
				.innerRadius(innerRadius - 1)
				.outerRadius(radius + 1)
				.startAngle(function (d) { 
					return d.startRad;
				})
				.endAngle(function (d) { 
					return d.endRad;
				});
			
			var hackArcGroup = svg.append("g")
				.attr("id", "hack-arc-group")
				.attr("transform", "translate(" + (anchorPoint[0] + margin.left) + ", " + (anchorPoint[1] + margin.top) + ") rotate(" + ROTATE_ANGLE + ")")
				.selectAll("g")
				.data([hackData])
				.enter();
			
			hackArcGroup.append("path")
				.attr("id", "hack-arc")
				.attr("class", "hack-arc")
				.attr("d", hackArc);							
		}
		
		function _fade(opacity) {
			return function (g, i) {
				svg.selectAll('.connections')
					.filter(function (d) {
						return d.source.application !== g[level1];
					})
					.transition()
					.style('opacity', opacity);
			};
		}
		
		function _fadeConnections(opacity) {
			return function (g, i) {
				svg.selectAll('.connections')
				.filter(function (d) {
					return d.source.application !== g.source.application;
				})
				.transition()
				.style('opacity', opacity);
			};
		}
		
		function _fadeConnectionsHead(opacity) {
			return function (g, i) {
				svg.selectAll('.connections')
				.filter(function (d) {
					return d.source.name !== g[level2];
				})
				.transition()
				.style('opacity', opacity);
			};
        }
        
		function _relayout(data) {
			var count;
			uniqueHeadData = {};
			dataForSCChart = {};
			appBoxHeight = (daHeight / data.length - V_PADDING);
			data.forEach(function (datum, dIndex) {
				var appTotal = 0;
				if (!dataForSCChart[datum[level1]]) {
					dataForSCChart[datum[level1]] = [];
				}
				datum[contributorsField].forEach(function (contributor, contIndex) {
					count = 0;
					contributor[contData].forEach(function (d, index) {
						count += parseInt(d[value], 10);
						dataForSCChart[datum[level1]].push({"type": contributor[level2], "code": d[level3], "count": d[value], "application": datum[level1]});
					});
					contributor.total = count;
					appTotal += count;
					if (uniqueHeadData[contributor[level2]]) {
						uniqueHeadData[contributor[level2]] += count;
					}
					else {
						uniqueHeadData[contributor[level2]] = count;
					}
				});
				datum.appBox = {"width": APP_BOX_WIDTH, "height": appBoxHeight, "x": H_PADDING, "y": (V_PADDING * (dIndex + 1)) + (appBoxHeight * dIndex)};
				datum.appTotal = appTotal;
			});
		}
		
		function _sortHeadData() {
			toBeSortedHeadData = [];
			max = 0;
			for (var v in uniqueHeadData) {
				if (uniqueHeadData.hasOwnProperty(v)) {
					var p = {};
					p[level2] = v;
					p['value'] = uniqueHeadData[v];					
					toBeSortedHeadData.push(p);										
					max += uniqueHeadData[v];
				}
			}

			toBeSortedHeadData.sort(function (a, b) {
				if (a.value < b.value) {
					return -1;
				}
				else if (a.value > b.value) {
					return 1;
				}
				else {
					return 0;
				}
			});
		}
		
		function _calculateArcAngles() {
            var cumulativeValue = 0;
			toBeSortedHeadData.forEach(function (d, i) {
				// below scaling algorithm is based on following site:
				// http://stackoverflow.com/questions/5294955/how-to-scale-down-a-range-of-numbers-with-a-known-min-and-max-value
				cumulativeValue += d.value;
				d.scaledValue = (END_ANGLE - START_ANGLE) * (cumulativeValue - min) / (max - min) + START_ANGLE;
				d.startRad = (i === 0 ? X(START_ANGLE) : toBeSortedHeadData[i - 1].endRad);
				d.endRad = X(d.scaledValue);
				d.centroid = arc.centroid(d);
				var value = uniqueHeadData[d[level2]];
				uniqueHeadData[d[level2]] = {"value": value, "startRad": d.startRad, "endRad": d.endRad};
			});
		}
		
		function _calculateChordData(data) {
			var cumuForContributor = 0;
			chordData = [];
			var contRibbons = [], source = {}, target = {}, angles = {};
			for (var head in uniqueHeadData) {
				if (uniqueHeadData.hasOwnProperty(head)) {
					cumuForContributor = 0;
					for (var i = 0;i < data.length;i++) {
						for (var j = 0;j < data[i][contributorsField].length;j++) {
							var contributor = data[i][contributorsField][j];
							if (head === contributor[level2]) {
								cumuForContributor += contributor.total;
								var headForCont = uniqueHeadData[contributor[level2]];
								var eAngle = (headForCont.endRad - headForCont.startRad) * (cumuForContributor - min) / (headForCont.value - min) + headForCont.startRad;
								var stAngle = (cumuForContributor === contributor.total ? headForCont.startRad : contRibbons[contRibbons.length - 1].endAngle);
								var cent = d3.arc().innerRadius(innerRadius).outerRadius(radius).startAngle(headForCont.startRad).endAngle(eAngle).centroid();
								contRibbons.push({
									contributorPct: (contributor.total / headForCont.value * 100), 
									"application": data[i][level1], 
									"sourceid": data[i][level1], 
									"targetid": contributor[level2], 
									"startAngle": stAngle, 
									"endAngle": eAngle, 
									"color": HEAD_COLOR(contributor[level2]), 
									"radius": innerRadius, 
									"centroid": cent,
									"name":  data[i][contributorsField][j][level2]
								});
								break;
							}
						}
					}
				}
			}

			for (var i1 = 0; i1 < contRibbons.length; i1++) {
				var cord = contRibbons[i1];
				var appX, appY, appEAngle;
				source = {"id": cord.sourceid, "startAngle": cord.startAngle, "endAngle": cord.endAngle, "radius": cord.radius, "color": cord.color, "application": cord.application, "name": cord.name};
				for (var j1 = 0; j1 < data.length; j1++) {
					if (cord.application === data[j1][level1]) {
						appX = data[j1].appBox.width + data[j1].appBox.x;
						appY = data[j1].appBox.y + data[j1].appBox.height / 2;
						cord.x = appX;
						cord.y = appY;
						var slope = ((anchorPoint[1] - (appY)) / (anchorPoint[0] - appX));
						appEAngle = Math.atan(slope);
						if (angles[cord.application]) {
							appEAngle = angles[cord.application];
						}
						else {
							angles[cord.application] = appEAngle;
						}
						break;
					}
				}
				var tmpCent = d3.arc().centroid({"startAngle": appEAngle + ROTATE_RADIAN, "endAngle": appEAngle + ROTATE_RADIAN, "innerRadius": anchorPoint[0] - appX - H_PADDING, "outerRadius": anchorPoint[0] - appX - H_PADDING});
				var chordDist = Math.sqrt((((tmpCent[0] + anchorPoint[0] - appX) * (tmpCent[0] + anchorPoint[0] - appX)) + ((tmpCent[1] + anchorPoint[1] - appY) * (tmpCent[1] + anchorPoint[1] - appY))));
				target = {"id": cord.targetid, "startAngle": appEAngle, "endAngle": appEAngle, "radius": anchorPoint[0] - appX - H_PADDING + chordDist, "color": cord.color, "application": cord.application};
				chordData.push({"key": (cord.sourceid + cord.targetid), "source": source, "target": target, contributorPct: cord.contributorPct});
			}
		}
		
		function _calculateDefs(data) {
			data.forEach(function (datum, index) {
				datum.contributors.forEach(function (contributor, contIndex) {
					var contPercent = contributor.total / datum.appTotal;
					datum.contributors[contIndex][level1] = datum[level1];
					datum.contributors[contIndex].rectHeight = datum.appBox.height * contPercent;
					datum.contributors[contIndex].yPos = (contIndex === 0 ? datum.appBox.y : datum.contributors[contIndex - 1].yPos + datum.contributors[contIndex - 1].rectHeight);
				});
			});
			
			var gradient = defs.append("radialGradient")
				.attr("id", "pie_shine")
				.attr("cx", "50%")
				.attr("cy", "50%")
				.attr("r", "50%");
			
			gradient.append("stop")
				.attr("stop-color", "black")
				.attr("stop-opacity", 0)
				.attr("offset", "54.25%");
			gradient.append("stop")
				.attr("stop-color", "black")
				.attr("stop-opacity", 0.8)
				.attr("offset", "54.25%");
			gradient.append("stop")
				.attr("stop-color", "white")
				.attr("stop-opacity", 1)
				.attr("offset", "76.5%");
			gradient.append("stop")
				.attr("stop-color", "black")
				.attr("stop-opacity", 0.8)
				.attr("offset", "99%");
			
			var cylinder_shine = defs.append("linearGradient")
				.attr("id", "cylinder_shine")
				.attr("x1", "0%")
				.attr("y1", "0%")
				.attr("x2", "100%")
				.attr("y2", "0%");
			
			cylinder_shine.append("stop")
				.attr("stop-color", "black")
				.attr("stop-opacity", 0.2)
				.attr("offset", "0%");
			cylinder_shine.append("stop")
				.attr("stop-color", "white")
				.attr("stop-opacity", 0.5)
				.attr("offset", "50%");
			cylinder_shine.append("stop")
				.attr("stop-color", "black")
				.attr("stop-opacity", 0.4)
				.attr("offset", "100%");
		}
		
		function _writeArcLables() {
			this.attr("transform", function (d, i) {
					var angle = (d.startRad + d.endRad) / 2 * 180 / Math.PI;
					return "translate(" + arc.centroid(d) + ") rotate(" + angle + ") rotate(270)";
				})
				.attr("class", "arc-label")
				.attr("dy", "0.35em")
				.attr("text-anchor", function (d) {
					return "middle";
				})
				.style("cursor", "default")
				.text(function (d) {
					return d[level2];
				});
		}
		
		function _writeAppLabels() {
			this.attr("transform", function (d, i) {
					return "translate(" + (d.appBox.x - 7) + ", " + (d.appBox.y + (d.appBox.height / 2)) + ") rotate(" + 0 + ")";
				})
				.attr("class", "app-label")
				.attr("dy", "0.35em")
				.attr("text-anchor", function (d) {
					return "end";
				})
				.style("cursor", "default")
				.text(function (d) {
					return d[level1];
				});
		}
		
		function _drawAppRectangles(data) {
			var appsGrp = apps.selectAll("g.app")
				.data(data, function (d) {
					var idString = d[level1];
					d[contributorsField].forEach(function (d, index) {
						idString += d[level2];
					});
					return idString;
				});
			
			var appHeight = data[0].appBox.height;
			var appWidth = data[0].appBox.width;
			var newApps = appsGrp.enter().append("g")
				.attr("class", "app")
				.attr("id", function (d) { 
					return d[level1];
				});
			var contributors = newApps.selectAll("g.app").data(function (d) { 
					return d[contributorsField];
				}, function (d) { 
					return d[level1] + "_" + d[level2];
				});
			
			contributors.enter().append("rect")
				.attr("id", function (d) { 
					return d[level1] + "_" + d[level2];
				})
				.attr("class", "contributor")
				.attr("width", appWidth)
				.attr("x", 19)
				.style("fill", function (d) {
					return HEAD_COLOR(d[level2]);
				})
				.on("mouseover", function (d) {
					_fade(0.1)(d);
				})
				.on("mouseout", function (d) {
					_fade(1.0)(d);
				})
				.on("click", function (d, i) {
					var clickedContributor = [];				
					for (var ii = 0;ii < origData.length;ii++) {					
						if(origData[ii][level1] == d[level1]) {
							origData[ii]['contributors'].forEach(function(c) {
								c.data.forEach(function(data) {
									clickedContributor.push(data);
								});							
							});						
						}										
					}
				});
			
			contributors.attr("y", function (d) {
					return d.yPos;
				})
				.transition(t)
				.attr("height", function (d, i) {
					return d.rectHeight;
				})
                .each(enableMouseEvents);
			
			apps.selectAll("g.app")
				.data(data, function (d) {
					var idString = d[level1];
					d[contributorsField].forEach(function (d, index) {
						idString += d[level2];
					});
					return idString;
				})
				.selectAll("rect.contributor")
				.data(function (d) { 
					return d[contributorsField];
				})
				.attr("y", function (d) {
					return d.yPos;
				})
				.transition(t)
				.attr("height", function (d) { 
					return d.rectHeight;
				})
                .each(enableMouseEvents);
			
			appsGrp.exit().transition(t).style("opacity", 0).remove();
		}
		
		function _arcTween(d, i, a) {
			var currData = prevArcData.filter(function (f) {
				return f.name === d[level2];
			})[0];
			if (!currData) {
				currData = {};
				currData.name = d[level2];
				currData.value = d.value;
				currData.scaledValue = d.scaledValue;
				currData.startRad = 0;
				currData.endRad = 0;
				currData.centroid = d.centroid;
			}
			var startRadIP = d3.interpolate(currData.startRad, d.startRad);
			var endRadIP = d3.interpolate(currData.endRad, d.endRad);
			
			return function (t) {
				d.startRad = startRadIP(t);
				d.endRad = endRadIP(t);
				return arc(d);
			};
		}
		
		function _drawArcs() {
			this.attr("class", "arcs")
				.style("fill-opacity", 0.7)
				.style("fill", function (d) {
					return HEAD_COLOR(d[level2]);
				})
				.transition(t)
				.attrTween("d", _arcTween)
				.each("start", function () {
					svg.selectAll("text.arc-label").style("display", "none");
				})
				.each("end", function () {
					var arcTxt = svg.selectAll("text.arc-label")
					.data(toBeSortedHeadData, function (d) { 
						return d[level2];
					});
					
					arcTxt.style("display", "block").attr("transform", function (d, i) {
                        var angle = (d.startRad + d.endRad) / 2 * 180 / Math.PI;
                        return "translate(" + arc.centroid(d) + ") rotate(" + angle + ") rotate(270)";
                    })
                    .attr("class", "arc-label")
                    .attr("dy", "0.35em")
                    .attr("text-anchor", function (d) {
                        return "middle";
                    })
                    .style("cursor", "default")
                    .text(function (d) {
                        return d[level2];
                    });
				}, enableMouseEvents);
		}
		
		function _chordTween(d, i, a) {
			var currData = prevChordData.filter(function (f) {
				return f.key === d.key;
			})[0];
			if (!currData) {
				currData = {};
				currData.source = {};
				currData.target = {};
				currData.key = d.key;
				currData.source.id = d.source.id;
				currData.source.startAngle = 0;
				currData.source.endAngle = 0;
				currData.source.radius = Math.PI;
				currData.source.color = d.source.color;
				currData.source.application = d.source.application;
				
				currData.target.id = d.target.id;
				currData.target.startAngle = 0;
				currData.target.endAngle = 0;
				currData.target.radius = Math.PI;
				currData.target.color = d.target.color;
				currData.target.application = d.target.application;
			}
			
			var sourceStartAngleIP = d3.interpolate(currData.source.startAngle, d.source.startAngle);
			var sourceEndAngleIP = d3.interpolate(currData.source.endAngle, d.source.endAngle);
			var targetStartAngleIP = d3.interpolate(currData.target.startAngle, d.target.startAngle);
			var targetEndAngleIP = d3.interpolate(currData.target.endAngle, d.target.endAngle);
			
			return function (t) {
				d.source.startAngle = sourceStartAngleIP(t);
				d.source.endAngle = sourceEndAngleIP(t);
				d.target.startAngle = targetStartAngleIP(t);
				d.target.endAngle = targetEndAngleIP(t);
				return chord(d);
			};
        }
        		
		function dataChecker(data) {
            let counter = 0;
			data.forEach(function (d) {
				d[contributorsField].forEach(function (du) {
					du[contData].forEach(function (dw) {
                        ++counter;
						if (isNaN(dw[value])) {
							throw new Error("In the record "  + JSON.stringify(du) + " for '" + d[level1] + "'," + "'" + value + "'" + " is not numeric");
						}
					});
				});
            });
		}
		
		function _render(data) {
			var total = 0;
			var count = 0;
			
			dataChecker(data);
			origData = data;
			
			_relayout(data);
			_sortHeadData();
			_calculateArcAngles();
			_calculateChordData(data);
			
			defs = svg.append("defs");
			_calculateDefs(data);
			
			arcGroup = svg.append("g")
				.attr("transform", "translate(" + (anchorPoint[0] + margin.left) + ", " + (anchorPoint[1] + margin.top) + ") rotate(" + ROTATE_ANGLE + ")");
			
			arcGroup.append("circle")
				.attr("r", radius)
				.style("fill", "url(#pie_shine)");
			
			arcGroup.selectAll("g")
				.data(toBeSortedHeadData, function (d) { 
					return d[level2];
				})
				.enter()
				.append("path")
				.on("mouseover", function (d) {
					_fadeConnectionsHead(0.1)(d);
				})
				.on("mouseout", function (d) {
					_fadeConnectionsHead(1.0)(d);
				})
				.on("click", function (d, i) {
					var clickedContributor = [];
					for (var ii = 0;ii < origData.length;ii++) {
						origData[ii]['contributors'].forEach(function(c){
								if(c[level2] == d[level2]) {
									c.data.forEach(function(data) {
										clickedContributor.push(data);
									});
								}
						});					
					}
                })
                .attr("class", "arcs")
				.style("fill-opacity", 0.7)
				.style("fill", function (d) {
					return HEAD_COLOR(d[level2]);
				})
				.transition(t)
				.attrTween("d", _arcTween)
                .each(function () {
					svg.selectAll("text.arc-label").style("display", "none");
				})
                .each(function () {
					var arcTxt = svg.selectAll("text.arc-label")
					.data(toBeSortedHeadData, function (d) { 
						return d[level2];
					});
					
					arcTxt.style("display", "block").attr("transform", function (d, i) {
                        var angle = (d.startRad + d.endRad) / 2 * 180 / Math.PI;
                        return "translate(" + arc.centroid(d) + ") rotate(" + angle + ") rotate(270)";
                    })
                    .attr("class", "arc-label")
                    .attr("dy", "0.35em")
                    .attr("text-anchor", function (d) {
                        return "middle";
                    })
                    .style("cursor", "default")
                    .text(function (d) {
                        return d[level2];
                    });
				}, enableMouseEvents);
			
			arcGroup.selectAll("g")
				.data(toBeSortedHeadData, function (d) { 
					return d[level2];
				})
				.enter()
				.append("text")
				.on("mouseover", function (d) {
					_fadeConnectionsHead(0.1)(d);
				})
				.attr("transform", function (d, i) {
					var angle = (d.startRad + d.endRad) / 2 * 180 / Math.PI;
					return "translate(" + arc.centroid(d) + ") rotate(" + angle + ") rotate(270)";
				})
				.attr("class", "arc-label")
				.attr("dy", "0.35em")
				.attr("text-anchor", function (d) {
					return "middle";
				})
				.style("cursor", "default")
				.text(function (d) {
					return d[level2];
                });
				
				_hackToHideArc();
				
				ribbons = svg
                    .append("g")
                    .attr("id", "connectors")
                    .attr("transform", "translate(" + (anchorPoint[0] + margin.left) + ", " + (anchorPoint[1] + margin.top) + ") rotate(270)");
				
				ribbons.selectAll("g")
                    .data(chordData, function (d, i) {
                        return d.key;
                    })
                    .enter()
                    .append("path")
                    .on("mouseover", function (d, i) {
                        _fadeConnections(0.1)(d);
                    })
                    .on("mouseout", function (d, i) {
                        _fadeConnections(1.0)(d);
                    })
                    .on("click", function (d, i) {
                        var clickedContributor = [];
                        for (var ii = 0;ii < origData.length;ii++) {
                            if(origData[ii][level1] == d.source.id) {
                                origData[ii]['contributors'].forEach(function(c){							
                                        c.data.forEach(function(data) {
                                            if(data[level2]==d.target.id) {
                                                clickedContributor.push(data);
                                            }
                                        });							
                                });
                            }
                        }
                    })
                    .attr("class", "connections")
                    .attr("id", function (d, i) {
                        return (d.source.id + d.target.id);
                    })
                    .style("fill", function (d, i) {
                        return d.source.color;
                    })
                    .style("stroke", function (d, i) {
                        return d3.rgb(d.source.color).darker();
                    })
                    .transition(t)
                    .attrTween("d", _chordTween)
                    .each(enableMouseEvents);
			
			apps = svg.append("g")
				.attr("class", "apps")
				.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");;
			
			_drawAppRectangles(data);
			
			apps.selectAll("g.app-label")
				.data(data)
				.enter()
				.append("text")
                .attr("transform", function (d, i) {
					return "translate(" + (d.appBox.x - 7) + ", " + (d.appBox.y + (d.appBox.height / 2)) + ") rotate(" + 0 + ")";
				})
				.attr("class", "app-label")
				.attr("dy", "0.35em")
				.attr("text-anchor", function (d) {
					return "end";
				})
				.style("cursor", "default")
				.text(function (d) {
					return d[level1];
				});
		}
		
		function _update(data) {
			dataChecker(data);
			origData = data
            
            let elem = document.getElementById(containerId);
            if (elem && elem.classList)
                elem.classList.add('no-mouse');
			
			_relayout(data);
			_sortHeadData();
			_calculateArcAngles();
			_calculateChordData(data);
			_calculateDefs(data);
			
            _drawAppRectangles(data);
            
			svg.select('.title')
                .attr("text-anchor", "middle")
                .attr("x", svg.attr("width") / 2)
                .attr("y", 12)
                .text(config.container.title);
			
			var appTxt = apps.selectAll(".app-label")
				.data(data);
			
			appTxt.attr("transform", function (d, i) {
                return "translate(" + (d.appBox.x - 7) + ", " + (d.appBox.y + (d.appBox.height / 2)) + ") rotate(" + 0 + ")";
            })
                .attr("class", "app-label")
                .attr("dy", "0.35em")
                .attr("text-anchor", function (d) {
                    return "end";
                })
                .style("cursor", "default")
                .text(function (d) {
                    return d[level1];
                });
			
			appTxt.enter()
				.append("text")
				.attr("transform", function (d, i) {
					return "translate(" + (d.appBox.x - 7) + ", " + (d.appBox.y + (d.appBox.height / 2)) + ") rotate(" + 0 + ")";
				})
				.attr("class", "app-label")
				.attr("dy", "0.35em")
				.attr("text-anchor", function (d) {
					return "end";
				})
				.style("cursor", "default")
				.text(function (d) {
					return d[level1];
                });
			
			appTxt.exit().remove();
			
			prevArcData = arcGroup.selectAll("path.arcs").data();
			
			let arcs = arcGroup.selectAll("path.arcs")
				.data(toBeSortedHeadData, function (d) { 
					return d[level2];
				});
			
			arcs.attr("d", arc);
			
			arcs.enter().append("path")
				.attr("class", "arcs")
				.attr("id", function (d) { 
					return "arc-" + d[level2];
				})
				.attr("fill", function (d, i) {
					return HEAD_COLOR(d[level2]);
				})
				.on("mouseover", function (d) {
				})
				.on("mouseout", function (d) {
					_fadeConnectionsHead(1.0)(d);
				});
			
            arcs.attr("class", "arcs")
                .style("fill-opacity", 0.7)
                .style("fill", function (d) {
                    return HEAD_COLOR(d[level2]);
                })
                .transition(t)
                .attrTween("d", _arcTween)
                .each(function () {
                    svg.selectAll("text.arc-label").style("display", "none");
                })
                .each(function () {
                    var arcTxt = svg.selectAll("text.arc-label")
                    .data(toBeSortedHeadData, function (d) { 
                        return d[level2];
                    });
                    
                    arcTxt.style("display", "block").attr("transform", function (d, i) {
                        var angle = (d.startRad + d.endRad) / 2 * 180 / Math.PI;
                        return "translate(" + arc.centroid(d) + ") rotate(" + angle + ") rotate(270)";
                    })
                    .attr("class", "arc-label")
                    .attr("dy", "0.35em")
                    .attr("text-anchor", function (d) {
                        return "middle";
                    })
                    .style("cursor", "default")
                    .text(function (d) {
                        return d[level2];
                    });
                }, enableMouseEvents);
			
            arcs.exit().transition(t).attrTween("d", _arcTween).remove();
			
			var arcTxt = arcGroup.selectAll("text.arc-label")
				.data(toBeSortedHeadData, function (d) { 
					return d[level2];
				});
			
			arcTxt.enter()
				.append("text")
				.attr("transform", function (d, i) {
					var angle = (d.startRad + d.endRad) / 2 * 180 / Math.PI;
					return "translate(" + arc.centroid(d) + ") rotate(" + angle + ") rotate(270)";
				})
				.attr("class", "arc-label")
				.attr("dy", "0.35em")
				.attr("text-anchor", function (d) {
					return "middle";
				})
				.style("cursor", "default")
				.text(function (d) {
					return d[level2];
                });
			
			arcTxt.exit().remove();
			
			prevChordData = ribbons.selectAll(".connections").data();
			
			var updChord = ribbons.selectAll(".connections")
				.data(chordData, function (d, i) {
					return d.key;
				});
				
				updChord.attr("class", "connections")
                    .attr("id", function (d, i) {
                        return (d.source.id + d.target.id);
                    })
                    .style("fill", function (d, i) {
                        return d.source.color;
                    })
                    .style("stroke", function (d, i) {
                        return d3.rgb(d.source.color).darker();
                    })
                    .transition(t)
                    .attrTween("d", _chordTween)
                    .each(enableMouseEvents);
				
				updChord.enter()
                    .append("path")
                    .on("mouseover", function (d, i) {
                        _fadeConnections(0.1)(d);
                    })
                    .on("mouseout", function (d, i) {
                        _fadeConnections(1.0)(d);
                    })
                    .attr("class", "connections")
                    .attr("id", function (d, i) {
                        return (d.source.id + d.target.id);
                    })
                    .style("fill", function (d, i) {
                        return d.source.color;
                    })
                    .style("stroke", function (d, i) {
                        return d3.rgb(d.source.color).darker();
                    })
                    .transition(t)
                    .attrTween("d", _chordTween)
                    .each(enableMouseEvents);
			
			updChord.exit().transition(t).style("opacity", 0).remove();
		}
		
		function _transform(data) {
			var formattedData = [];
			var nester = d3.nest()
				.key(function(d) {
					return d[config.bindings.level1];
				})
				.key(function(d) {
					return d[config.bindings.level2];
				})
				.entries(data);
				
				nester.forEach(function(level1Record) {
					var o ={};
					o[level1] = level1Record.key;
					o['contributors']= [];
					formattedData.push(o);
				});
				
				var i = 0;
				nester.forEach(function(d) {
					d.values.forEach(function(c) {
						var d = {};
						d[level2] = c.key;
						d['data'] = c.values;
						formattedData[i].contributors.push(d);
					});
					i += 1;
				});
			return formattedData;
		}
		
		function graph() {
			return {	
				render: function (data) {
					var formattedData =_transform(data);					
					_render(formattedData);
					return graph;
				},
				update: function (data) {
					var formattedData =_transform(data);					
					_update(formattedData);
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