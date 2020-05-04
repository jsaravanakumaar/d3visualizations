if (!window.kgs) { kgs = {}; }
if (!window.kgs.widgets) { kgs.widgets = {}; }

kgs.widgets.SankeyDiagram = (function (d3) {
    "use strict";

    const Generator = function (config) {
      const containerId = config.container.id;
      const width = (config.container.width && parseInt(config.container.width, 10)) || screen.availWidth;
      const height = (config.container.height && parseInt(config.container.height, 10)) || screen.availHeight;
      const nodeWidth = (config.sankey && config.sankey.nodeWidth && parseInt(config.sankey.nodeWidth, 10)) || 24;
      const nodePadding = (config.sankey && config.sankey.nodePadding && parseInt(config.sankey.nodePadding, 10)) || 8;
      
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
      
      const daWidth = width - margin.left - margin.right;
      const daHeight = height - margin.top - margin.bottom;
      const formatNumber = d3.format(",.0f");    // zero decimal places
      const format = function(d) { return formatNumber(d) + " "; };
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const svg = d3.select(containerId).append("svg")
        .attr("id", "sankey-diagram")
        .attr("class", "sankey-diagram")
        .attr("width", width)
        .attr("height", height);

      if (config.container.title) {
        svg.append("text")
          .attr("class", "title")
          .attr("text-anchor", "middle")
          .attr("x", svg.attr("width") / 2)
          .attr("y", 12)
          .text(config.container.title);
      }

      const sankeyG = svg.append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

      const removeSpaces = function(str) {
        return str.split(" ").join("");
      }

      // Reused from https://bl.ocks.org/d3noob/fe03d1a36c074038157801d52578d470
      d3.sankey = function() {
        let sankey = {},
          size = [1, 1],
          nodeWidth = 24,
          nodePadding = 8,
          nodes = [],
          links = [];
      
        sankey.nodeWidth = function(_) {
          if (!arguments.length) return nodeWidth;
          nodeWidth = +_;
          return sankey;
        };
      
        sankey.nodePadding = function(_) {
          if (!arguments.length) return nodePadding;
          nodePadding = +_;
          return sankey;
        };
      
        sankey.nodes = function(_) {
          if (!arguments.length) return nodes;
          nodes = _;
          return sankey;
        };
      
        sankey.links = function(_) {
          if (!arguments.length) return links;
          links = _;
          return sankey;
        };
      
        sankey.size = function(_) {
          if (!arguments.length) return size;
          size = _;
          return sankey;
        };
      
        sankey.layout = function(iterations) {
          computeNodeLinks();
          computeNodeValues();
          computeNodeBreadths();
          computeNodeDepths(iterations);
          computeLinkDepths();
          return sankey;
        };
      
        sankey.relayout = function() {
          computeLinkDepths();
          return sankey;
        };
      
        sankey.link = function() {
          var curvature = .5;
      
          function link(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = d.source.y + d.sy + d.dy / 2,
                y1 = d.target.y + d.ty + d.dy / 2;
            return "M" + x0 + "," + y0
                  + "C" + x2 + "," + y0
                  + " " + x3 + "," + y1
                  + " " + x1 + "," + y1;
          }
      
          link.curvature = function(_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
          };
      
          return link;
        };
      
        // Populate the sourceLinks and targetLinks for each node.
        // Also, if the source and target are not objects, assume they are indices.
        function computeNodeLinks() {
          nodes.forEach(function(node) {
            node.sourceLinks = [];
            node.targetLinks = [];
          });
          links.forEach(function(link) {
            var source = link.source,
                target = link.target;
            if (typeof source === "number") source = link.source = nodes[link.source];
            if (typeof target === "number") target = link.target = nodes[link.target];
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
          });
        }
      
        // Compute the value (size) of each node by summing the associated links.
        function computeNodeValues() {
          nodes.forEach(function(node) {
            node.value = Math.max(
              d3.sum(node.sourceLinks, value),
              d3.sum(node.targetLinks, value)
            );
          });
        }
      
        // Iteratively assign the breadth (x-position) for each node.
        // Nodes are assigned the maximum breadth of incoming neighbors plus one;
        // nodes with no incoming links are assigned breadth zero, while
        // nodes with no outgoing links are assigned the maximum breadth.
        function computeNodeBreadths() {
          var remainingNodes = nodes,
              nextNodes,
              x = 0;
      
          while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function(node) {
              node.x = x;
              node.dx = nodeWidth;
              node.sourceLinks.forEach(function(link) {
                nextNodes.push(link.target);
              });
            });
            remainingNodes = nextNodes;
            ++x;
          }
      
          //
          moveSinksRight(x);
          scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
        }
      
        function moveSourcesRight() {
          nodes.forEach(function(node) {
            if (!node.targetLinks.length) {
              node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
            }
          });
        }
      
        function moveSinksRight(x) {
          nodes.forEach(function(node) {
            if (!node.sourceLinks.length) {
              node.x = x - 1;
            }
          });
        }
      
        function scaleNodeBreadths(kx) {
          nodes.forEach(function(node) {
            node.x *= kx;
          });
        }
      
        function computeNodeDepths(iterations) {
          var nodesByBreadth = d3.nest()
              .key(function(d) { return d.x; })
              .sortKeys(d3.ascending)
              .entries(nodes)
              .map(function(d) { return d.values; });
      
          //
          initializeNodeDepth();
          resolveCollisions();
          for (var alpha = 1; iterations > 0; --iterations) {
            relaxRightToLeft(alpha *= .99);
            resolveCollisions();
            relaxLeftToRight(alpha);
            resolveCollisions();
          }
      
          function initializeNodeDepth() {
            var ky = d3.min(nodesByBreadth, function(nodes) {
              return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
            });
      
            nodesByBreadth.forEach(function(nodes) {
              nodes.forEach(function(node, i) {
                node.y = i;
                node.dy = node.value * ky;
              });
            });
      
            links.forEach(function(link) {
              link.dy = link.value * ky;
            });
          }
      
          function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function(nodes, breadth) {
              nodes.forEach(function(node) {
                if (node.targetLinks.length) {
                  var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                  node.y += (y - center(node)) * alpha;
                }
              });
            });
      
            function weightedSource(link) {
              return center(link.source) * link.value;
            }
          }
      
          function relaxRightToLeft(alpha) {
            nodesByBreadth.slice().reverse().forEach(function(nodes) {
              nodes.forEach(function(node) {
                if (node.sourceLinks.length) {
                  var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
                  node.y += (y - center(node)) * alpha;
                }
              });
            });
      
            function weightedTarget(link) {
              return center(link.target) * link.value;
            }
          }
      
          function resolveCollisions() {
            nodesByBreadth.forEach(function(nodes) {
              var node,
                  dy,
                  y0 = 0,
                  n = nodes.length,
                  i;
      
              // Push any overlapping nodes down.
              nodes.sort(ascendingDepth);
              for (i = 0; i < n; ++i) {
                node = nodes[i];
                dy = y0 - node.y;
                if (dy > 0) node.y += dy;
                y0 = node.y + node.dy + nodePadding;
              }
      
              // If the bottommost node goes outside the bounds, push it back up.
              dy = y0 - nodePadding - size[1];
              if (dy > 0) {
                y0 = node.y -= dy;
      
                // Push any overlapping nodes back up.
                for (i = n - 2; i >= 0; --i) {
                  node = nodes[i];
                  dy = node.y + node.dy + nodePadding - y0;
                  if (dy > 0) node.y -= dy;
                  y0 = node.y;
                }
              }
            });
          }
      
          function ascendingDepth(a, b) {
            return a.y - b.y;
          }
        }
      
        function computeLinkDepths() {
          nodes.forEach(function(node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
          });
          nodes.forEach(function(node) {
            var sy = 0, ty = 0;
            node.sourceLinks.forEach(function(link) {
              link.sy = sy;
              sy += link.dy;
            });
            node.targetLinks.forEach(function(link) {
              link.ty = ty;
              ty += link.dy;
            });
          });
      
          function ascendingSourceDepth(a, b) {
            return a.source.y - b.source.y;
          }
      
          function ascendingTargetDepth(a, b) {
            return a.target.y - b.target.y;
          }
        }
      
        function center(node) {
          return node.y + node.dy / 2;
        }
      
        function value(link) {
          return link.value;
        }
      
        return sankey;
      };

      const sankeyDiagram = d3.sankey().nodeWidth(nodeWidth).nodePadding(nodePadding).size([daWidth, daHeight]);
      let path = sankeyDiagram.link();

      const _render = function(data) {
        var nodeMap = {};
        data.nodes.forEach(function(x) { nodeMap[x.name] = x; });
        data.links = data.links.map(function(x) {
          return {
            source: nodeMap[x.source],
            target: nodeMap[x.target],
            value: x.value
          };
        });
    
        sankeyDiagram
          .nodes(data.nodes)
          .links(data.links)
          .layout(16);
    
        // add in the links
        var link = sankeyG.append("g").selectAll(".link")
            .data(data.links)
          .enter().append("path")
            .attr("class", function(d, i) {
              return removeSpaces(d.source.name) + " link";
            })
            .attr("d", path)
            .style("stroke-width", function(d) { return Math.max(1, d.dy); })
            .style("stroke", "#000000")
            .sort(function(a, b) { return b.dy - a.dy; });
      
        // add the link titles
        link.append("title")
            .text(function(d) {
              return d.source.name + " → " + 
                      d.target.name + "\n" + format(d.value); });
      
        // add in the nodes
        var node = sankeyG.append("g").selectAll(".node")
            .data(data.nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { 
              return "translate(" + d.x + "," + d.y + ")"; })
            .call(d3.drag().subject(function(d) {
                return d;
              })
              .on("start", function() {
                this.parentNode.appendChild(this);
              })
              .on("drag", function (d) {
                d3.select(this).attr("transform", "translate(" + d.x + "," + (
                  d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
                  ) + ")");
                sankeyDiagram.relayout();
                link.attr("d", path);
              }));
      
        // add the rectangles for the nodes
        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankeyDiagram.nodeWidth())
            .style("fill", function(d) { 
              return d.color = color(d.name.replace(/ .*/, "")); })
            .style("stroke", function(d) { 
              return d3.rgb(d.color).darker(2); })
            .on("mouseover", (d, i) => {
              sankeyG.selectAll("." + removeSpaces(d.name)).style("stroke", "red");
            })
            .on("mouseout", (d, i) => {
              sankeyG.selectAll("." + removeSpaces(d.name)).style("stroke", "#000000");
            })
          .append("title")
            .text(function(d) { 
              return d.name + "\n" + format(d.value); });
      
        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
          .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankeyDiagram.nodeWidth())
            .attr("text-anchor", "start");
    }

    const _update = function(data) {
      var nodeMap = {};
      data.nodes.forEach(function(x) { nodeMap[x.name] = x; });
      data.links = data.links.map(function(x) {
        return {
          source: nodeMap[x.source],
          target: nodeMap[x.target],
          value: x.value
        };
      });
  
      sankeyDiagram
        .nodes(data.nodes)
        .links(data.links)
        .layout(32);

      svg.select('.title')
        .attr("text-anchor", "middle")
        .attr("x", svg.attr("width") / 2)
        .attr("y", 12)
        .text(config.container.title);
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