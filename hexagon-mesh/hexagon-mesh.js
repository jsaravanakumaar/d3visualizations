if (!window.tgs) { tgs = {}; }
if (!window.tgs.widgets) { tgs.widgets = {}; }

tgs.widgets.Hexagon = (function (d3) {
    "use strict";

    const Generator = function (config) {
        const containerId = config.container.id;
        const graphWidth = Number(config.container.width);
        const graphHeight = Number(config.container.height);

        const hexRadius = config.radius;
        const hexDia = hexRadius * 2;

        const hexagonHorCount = Math.floor(graphWidth / hexDia);
        const hexagonVerCount = Math.floor(graphHeight / hexDia);

        let hexagonGroup = null;
        let hexagonMesh = null;
        let x1 = 0;
        let y1 = hexRadius;
        let x2, y2, x3, y3, x4, y4, x5, y5, x6, y6;
        let lineGenerator = d3.line();
        let meshSpec = new Array();

        const _prepareData = function () {
            let hexagonCounter = 0;
            for (let i = 0; i < hexagonHorCount;++i) {
                for (let j = 0; j < hexagonVerCount;++j) {
                    x2 = x1 + hexRadius / 2;
                    y2 = y1 - (hexRadius * Math.sin(Math.PI/3));

                    x3 = x2 + hexRadius;
                    y3 = y2;

                    x4 = x1 + hexRadius * 2;
                    y4 = y1;

                    x5 = x3;
                    y5 = y1 + (hexRadius * Math.sin(Math.PI/3));

                    x6 = x2;
                    y6 = y5;

                    meshSpec.push([[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x5, y5], [x6, y6]]);

                    y1 = y5 + (hexRadius * Math.sin(Math.PI/3));
                }
                if (i % 2 === 0) {
                    x1 = meshSpec[meshSpec.length - hexagonVerCount][4][0];
                    y1 = meshSpec[meshSpec.length - hexagonVerCount][4][1];
                } else {
                    x1 = meshSpec[meshSpec.length - hexagonVerCount][2][0];
                    y1 = meshSpec[meshSpec.length - hexagonVerCount][2][1];
                }
            }
        }

        const _render = function (data) {
            _prepareData();

            hexagonMesh = d3.select(containerId)
                .append("svg")
                    .attr("class", "hexagon-mesh")
                    .attr("width", graphWidth)
                    .attr("height", graphHeight)
                    .append("g")
                        .attr("class", "mesh-component")
                        .attr("transform", "translate(0, 0)")
                        .selectAll("g")
                            .data(meshSpec);

            hexagonGroup = hexagonMesh.enter()
                .append("g")
                .attr("class", "hexagon-group");

            hexagonGroup.append("path")
                .attr("class", "hexagon")
                .attr("d", d => lineGenerator(d))
                .attr("fill", (d, i) => {
                    let fillValue = data[i];
                    if (fillValue)
                        return fillValue["fill"];
                    else
                        return "none";
                });

            hexagonGroup.append("text")
                .attr("class", "label")
                .attr("x", (d, i) => d[0][0]) // + (d[3][0] - d[0][0]) / 2)
                .attr("y", (d, i) => d[1][1] + 5 + (d[4][1] - d[1][1]) / 2)
                .style("fill", "#000000")
                .style("text-anchor", "start")
                .attr("textLength", hexDia)
                .attr("lengthAdjust", "spacingAndGlyphs")
                .text((d, i) => {
                    let textValue = data[i];
                    if (textValue)
                        return textValue["text"];
                    else
                        return "";
                });
        }

        const _update = function(data) {
            //It is assumed that the Hexagon Mesh is not changed however the Hexagon's title and color changed.
            d3.selectAll(".hexagon").transition().duration(1000).attr("fill", (d, i) => {
                console.log(i + "|" + d);
                let fillValue = data[i];
                if (fillValue)
                    return fillValue["fill"];
                else
                    return "none";
            });
            
            d3.selectAll(".label").transition().duration(1000)
                .text((d, i) => {
                    let textValue = data[i];
                    if (textValue)
                        return textValue["text"];
                    else
                        return "";
                });
        }

        const graph = function () {
			return {
				render: function(data) {
					_render(data);
					return graph;
				},
				update: function(data) {
					_update(data);
					return graph;
				}
			};
		}

		return {graph: graph};
    }
    return {"Generator": Generator};
})(d3);