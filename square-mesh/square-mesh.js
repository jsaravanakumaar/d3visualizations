if (!window.tgs) { tgs = {}; }
if (!window.tgs.widgets) { tgs.widgets = {}; }

tgs.widgets.Square = (function (d3) {
    "use strict";

    const Generator = function (config) {
        const containerId = config.container.id;
        const graphWidth = Number(config.container.width);
        const graphHeight = Number(config.container.height);

        const side = config.side;

        const squareHorCount = Math.floor(graphWidth / side);
        const squareVerCount = Math.floor(graphHeight / side);

        let svg = null;
        let defs = null;
        let squareGroup = null;
        let squareMesh = null;
        let x1 = 0;
        let y1 = side;
        let x2, y2, x3, y3, x4, y4;
        let lineGenerator = d3.line();
        let meshSpec = new Array();

        const _prepareData = function () {
            let squareCounter = 0;
            for (let i = 0; i < squareHorCount;++i) {
                for (let j = 0; j < squareVerCount;++j) {
                    x2 = x1;
                    y2 = y1 - side;

                    x3 = x2 + side;
                    y3 = y2;

                    x4 = x3;
                    y4 = y3 + side;

                    meshSpec.push([[x1, y1], [x2, y2], [x3, y3], [x4, y4]]);

                    y1 = y1 + side;
                }
                x1 = x1 + side;
                y1 = side;
            }
        }

        const _render = function (data) {
            _prepareData();

            svg = d3.select(containerId)
                .append("svg")
                    .attr("class", "square-mesh")
                    .attr("width", graphWidth)
                    .attr("height", graphHeight);

            defs = svg.append("defs");

            let gradientDef0 = defs.append("linearGradient")
                    .attr("id", "Gradient0")
                    .attr("x1", "0")
                    .attr("y1", "0")
                    .attr("x2", "0.5")
                    .attr("y2", "0.5");

            gradientDef0.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".3");
            
            gradientDef0.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".3");

            gradientDef0.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "red")
                .attr("stop-opacity", ".3");
                
            let gradientDef1 = defs.append("linearGradient")
                    .attr("id", "Gradient1")
                    .attr("x1", "0")
                    .attr("y1", "0")
                    .attr("x2", "0.5")
                    .attr("y2", "0.5");

            gradientDef1.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".5");
            
            gradientDef1.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".5");

            gradientDef1.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "red")
                .attr("stop-opacity", ".5");
                
            let gradientDef2 = defs.append("linearGradient")
                .attr("id", "Gradient2")
                .attr("x1", "0")
                .attr("y1", "0")
                .attr("x2", "0.5")
                .attr("y2", "0.5");

            gradientDef2.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".7");
            
            gradientDef2.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".7");

            gradientDef2.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "red")
                .attr("stop-opacity", ".7");

            let gradientDef3 = defs.append("linearGradient")
                .attr("id", "Gradient3")
                .attr("x1", "0")
                .attr("y1", "0")
                .attr("x2", "0.5")
                .attr("y2", "0.5");

            gradientDef3.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".9");
            
            gradientDef3.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "green")
                .attr("stop-opacity", ".9");

            gradientDef3.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "red")
                .attr("stop-opacity", ".9");

            let greenGradientDef0 = defs.append("linearGradient")
                .attr("id", "GreenGradient0")
                .attr("x1", "0")
                .attr("y1", "0")
                .attr("x2", "0.5")
                .attr("y2", "0.5");

            greenGradientDef0.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".5");
            
            greenGradientDef0.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".5");

            let greenGradientDef1 = defs.append("linearGradient")
                .attr("id", "GreenGradient1")
                .attr("x1", "0")
                .attr("y1", "0")
                .attr("x2", "0.5")
                .attr("y2", "0.5");

            greenGradientDef1.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".5");
            
            greenGradientDef1.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".5");
                
            let greenGradientDef2 = defs.append("linearGradient")
                .attr("id", "GreenGradient2")
                .attr("x1", "0")
                .attr("y1", "0")
                .attr("x2", "0.5")
                .attr("y2", "0.5");

            greenGradientDef2.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".7");
            
            greenGradientDef2.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".7");

            let greenGradientDef3 = defs.append("linearGradient")
                .attr("id", "GreenGradient3")
                .attr("x1", "0")
                .attr("y1", "0")
                .attr("x2", "0.5")
                .attr("y2", "0.5");

            greenGradientDef3.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".9");
            
            greenGradientDef3.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "lightgreen")
                .attr("stop-opacity", ".9");

            squareMesh = svg
                    .append("g")
                        .attr("class", "mesh-component")
                        .attr("transform", "translate(0, 0)")
                        .selectAll("g")
                            .data(meshSpec);

            squareGroup = squareMesh.enter()
                .append("g")
                .attr("class", "square-group");

            squareGroup.append("path")
                .attr("class", "square")
                .attr("d", d => lineGenerator(d))
                .attr("fill", (d, i) => {
                    let fillValue = data[i];
                    if (fillValue)
                        return fillValue["fill"];
                    else
                        return "none";
                });
        }

        const _update = function(data) {
            //It is assumed that the Hexagon Mesh is not changed however the Hexagon's title and color changed.
            d3.selectAll(".square").transition().duration(1000).attr("fill", (d, i) => {
                let fillValue = data[i];
                if (fillValue)
                    return fillValue["fill"];
                else
                    return "none";
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