if (!window.cviz) window.cviz = {};
if (!cviz.widget) cviz.widget = {};

cviz.widget.LinkExplorer = (function(jQuery, d3, PubSub) {
  function Runner(options) {
    if (arguments.length < 1) {
      throw new Error("Please pass the chart options as per the API " +
          "Documentation!");
    }
    
    var chartTagId = (options.container && options.container.id) || 'body', 
      w = (options.container && options.container.width) || 900,
      h = (options.container && options.container.height) || 400;
    
    var nodeColor = d3.scale.category20();
    var linkColor = d3.scale.category20();
    var linkWidth = 2;
    var zoom = d3.behavior.zoom().scaleExtent([0.5, 5]);
    var chartElement = jQuery(chartTagId);
    var id, nodeName, nodeDetailUrl, nodeType;
    
    
    if (!(options && options.bindings && options.bindings.nodes))
      throw new Error("Mandatory parameter missing: bindings.nodes");

    id = options.bindings.nodes.id || "id";
    name = options.bindings.nodes.name || "name";
    detailUrl = options.bindings.nodes.detailURL || "detailURL";
    nodeType = options.bindings.nodes.nodeType.nodeType || "nodeType";
    ntMap = options.bindings.nodes.nodeType.imageMap;
    
    if (!(options && options.bindings && options.bindings.links)) 
      throw new Error("Mandatory parameter missing: bindings.links");
    
    if (!(options && options.bindings && options.bindings.links)) 
      throw new Error("Mandatory parameter missing: bindings.links");
    
    if (!(options && options.bindings && options.bindings.forwardLink)) 
      throw new Error("Mandatory parameter missing: bindings.forwardLink");
    
    if (!(options && options.bindings && options.bindings.reverseLink)) 
      throw new Error("Mandatory parameter missing: bindings.reverseLink");
    
    var sourceId = options.bindings.links.sourceId || "sourceId";
    var targetId = options.bindings.links.targetId || "targetId";
    var forward = options.bindings.links.forward || "forward";
    var reverse = options.bindings.links.reverse || "reverse";
    var frwdLinkType = options.bindings.forwardLink.linkType || "linkType";
    var frwdSubsystem = options.bindings.forwardLink.subsystem || "subsystem";
    var frwdDetailURL = options.bindings.forwardLink.detailURL || "detailURL";
    var revLinkType = options.bindings.reverseLink.linkType || "linkType";
    var revSubsystem = options.bindings.reverseLink.subsystem || "subsystem";
    var revDetailURL = options.bindings.reverseLink.detailURL || "detailURL";
    
    if (!options.detailViewer) {
      throw new Error("Please provide detail viewer configuration!");
    } else {
      if (!options.detailViewer.container) {
        throw new Error("Please provide container parameters for detail viewer configuration!");
      } else {
        options.detailViewer.container.id = options.detailViewer.container.id || chartTagId;
        options.detailViewer.container.width = options.detailViewer.container.width || 500;
        options.detailViewer.container.height = options.detailViewer.container.height || 350;
      }
    }
    //var detailViewer = cviz.DetailViewer.Panel(options.detailViewer);
    var vis, force, linksG, nodesG;
    var mdX, mdY, muX, muY, svgPan, viewBoxX, viewBoxY;
    var nodeNames = [];
    
    var dataDiscControls = '<div class="link-explorer widget-header" style="padding-top: 3px; margin-left: 20px;"><div style="position: absolute; font-size: .65em;font-weight: normal;padding-top: 3px;">Show Titles' +
      '<input class="show-text" type="checkbox"/></div><div style="position: absolute; font-size: .65em;font-weight: normal;margin-left: 80px;">Search Title: <input class="search-node" type="text" style="width: 205px"/></div></div>';
    
    var ccOptions = {
        "container": {
          "id": chartTagId,
          "width": 400,
          "height": 30
        },
        "widget": {
          "id": "link-explorer"
        }
    };
    
    //var controlsContainer = cviz.Controls.Panel(ccOptions).controlsId;
    
    //jQuery("#" + controlsContainer).append(dataDiscControls);

    function getNodeNames() {
      nodeNames.splice(0, nodeNames.length);
      var tmpNodes = force.nodes();
      for (var i = 0;i < tmpNodes.length;i++) {
        nodeNames.push(tmpNodes[i].name);
      }
      return nodeNames;
    }
    
    function moveWidget(event) {
      if (!isNaN(mdX) && !isNaN(mdY)) {
              
        var viewBoxM = svgPan.getAttribute("viewBox");
        var viewBoxValuesM = viewBoxM.split(' ');
        
        var newPosX = vewBoxX + (mdX - event.pageX);
        var newPosY = vewBoxY + (mdY - event.pageY);
        
        viewBoxValuesM[0] = newPosX;
        viewBoxValuesM[1] = newPosY;
        
        svgPan.setAttribute("viewBox", viewBoxValuesM.join(' '));
      }
    }
    
    chartElement.on('mousedown', function (event) {
      svgPan = document.getElementById("link-explorer");
      
      var viewBoxM = svgPan.getAttribute("viewBox");
      var viewBoxValuesM = viewBoxM.split(' ');
      
      vewBoxX = parseFloat(viewBoxValuesM[0]);
      vewBoxY = parseFloat(viewBoxValuesM[1]);
      
      mdX = event.pageX;
      mdY = event.pageY;
      chartElement.on('mousemove', function (event) {
        moveWidget(event);
      });
    });
    
    chartElement.on('mouseup', function (event) {
      muX = event.pageX;
      muY = event.pageY;
      chartElement.off('mousemove');
    })
    
    jQuery(document).on('keydown', function (event) {
      var svgPan = document.getElementById("link-explorer");
      var viewBox = svgPan.getAttribute('viewBox');
      var viewBoxValues = viewBox.split(' ');
      viewBoxValues[0] = parseFloat(viewBoxValues[0]);
      viewBoxValues[1] = parseFloat(viewBoxValues[1]);
      switch (event.keyCode) {
        case 27:
          detailViewer.close();
          break;
        case 37 /*left*/:
          viewBoxValues[0] += 10;
          break;
        case 39 /*right*/:
          viewBoxValues[0] -= 10;
          break;
        case 38 /*up*/:
          viewBoxValues[1] += 10;
          break;
        case 40 /*down*/:
          viewBoxValues[1] -= 10;
          break;
      }
      svgPan.setAttribute("viewBox", viewBoxValues.join(' '));
    });
    
    function startsWith(source, str) {
      return source.search(/http/) === 0;
    }
    
    function selectReverseLink(d) {
      var selQuery = "line.link.from-" + d.id + ".reverse";
      return linksG.selectAll(selQuery);
    }
    
    function selectFromLinks(d) {
      return linksG.selectAll("line.link.from-" + d.id);
    }
    
    function selectToLinks(d) {
      return linksG.selectAll("line.link.to-" + d.id);
    }
    
    function massageData(data) {
      var fNodes = force.nodes();
      var fLinks = force.links();
      var nodeToIndexMap = {};
      var massagedData = {};
      
      for (var i = 0;i < data.nodes.length;i++) {
        for (var j = 0; j < fNodes.length;j++) {
          if (data.nodes[i].id === fNodes[j].id) {
            data.nodes.splice(i, 1);
            i--;
            break;
          }
        }
      }
      
      for (var i = 0;i < data.links.length;i++) {
        for (var j = 0;j < fLinks.length;j++) {
          if (data.links[i][sourceId] === fLinks[j][sourceId] && data.links[i][targetId] === fLinks[j][targetId]) {
            data.links.splice(i, 1);
            i--;
            break;
          }
        }
      }
      
      for (var i = 0;i < fNodes.length;i++) {
        nodeToIndexMap[fNodes[i].id] = i;
      }
      
      for (var i = 0;i < data.nodes.length;i++) {
        nodeToIndexMap[data.nodes[i].id] = fNodes.length;
        fNodes.push(data.nodes[i]);
      }
      
      for (var i = 0;i < fLinks.length;i++) {
        fLinks[i].source = nodeToIndexMap[fLinks[i][sourceId]];
        fLinks[i].target = nodeToIndexMap[fLinks[i][targetId]];
      }
      
      for (var i = 0;i < data.links.length;i++) {
        fLinks.push(data.links[i]);
        fLinks[fLinks.length - 1].source = nodeToIndexMap[data.links[i][sourceId]];
        fLinks[fLinks.length - 1].target = nodeToIndexMap[data.links[i][targetId]];
      }
    }
    
    function redraw() {
      vis.attr('transform', "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
      force.resume();
    }
    
    function _processSubsystem(d) {
      if (!d.subsystem) {
        var subsystemNodes = [];
        var subsystemChildrenLinks = [];
        
        d.subsystem = {};
        d.subsystem.nodes = [];
        d.subsystem.links = [];
        
        var allLinks = force.links();
        var allNodes = force.nodes();
        
        for (var i = 0;i < allLinks.length;i++) {
          if (d.id === allLinks[i][sourceId] && allLinks[i][forward] && allLinks[i][forward][frwdSubsystem]) {
            d.subsystem.links.push(allLinks[i]);
            subsystemNodes.push(allLinks[i][targetId]);
          }
        }
        
        function getChildrenLinkOfSubsystemNodes(nodeId) {
          for (var i = 0;i < allLinks.length;i++) {
            if (nodeId === allLinks[i][sourceId]) {
              d.subsystem.links.push(allLinks[i]);
              getChildrenLinkOfSubsystemNodes(allLinks[i][targetId]);
            }
          }
        }
        
        for (var i = 0;i < subsystemNodes.length;i++) {
          getChildrenLinkOfSubsystemNodes(subsystemNodes[i]);
        }
        
        var nodeData = {};
        for (var i = 0;i < d.subsystem.links.length;i++) {
          if (nodeData[d.subsystem.links[i][sourceId]] === undefined) {
            for (var j = 0;j < allNodes.length;j++) {
              if (d.subsystem.links[i][sourceId] === allNodes[j][id] && d[id] !== allNodes[j][id]) {
                nodeData[d.subsystem.links[i][sourceId]] = allNodes[j];
                d.subsystem.nodes.push(allNodes[j]);
                allNodes.splice(j, 1);
              }
            }
          }
          
          if (nodeData[d.subsystem.links[i][targetId]] === undefined) {
            for (var j = 0;j < allNodes.length;j++) {
              if (d.subsystem.links[i][targetId] === allNodes[j][id] && d[id] !== allNodes[j][id]) {
                nodeData[d.subsystem.links[i][targetId]] = allNodes[j];
                d.subsystem.nodes.push(allNodes[j]);
                allNodes.splice(j, 1);
              }
            }
          }
        }
        
        for (var i = 0;i < d.subsystem.links.length;i++) {
          for (var j = 0;j < allLinks.length;j++) {
            if (d.subsystem.links[i][sourceId] === allLinks[j][sourceId] && d.subsystem.links[i][targetId] === allLinks[j][targetId]) {
              allLinks.splice(j, 1);
              break;
            }
          }
        }
        
        for (var i = 0;i < allLinks.length;i++) {
          var sourceNodeExists = false;
          var targetNodeExists = false;
          for (var j = 0;j < allNodes.length;j++) {
            if (allLinks[i][sourceId] === allNodes[j][id]) {
              sourceNodeExists = true;
            }
            if (allLinks[i][targetId] === allNodes[j][id]) {
              targetNodeExists = true;
            }
          }
          if (!sourceNodeExists) {
            allNodes.push(nodeData[allLinks[i][sourceId]]);
          }
          if (!targetNodeExists) {
            allNodes.push(nodeData[allLinks[i][targetId]]);
          }
        }
        
        _update({"nodes": allNodes, "links": allLinks}, false);
      } else {
        _update(d.subsystem);
        d.subsystem = null;
      }
    }
    
    function _update(data, execMassageData) {
      if (arguments.length === 1)
        massageData(data);
      
      getNodeNames();
      /*
      jQuery(".search-node").autocomplete({
        source: nodeNames,
        change: function(event, ui) {
          nodesG.selectAll(".blur").classed("blur", false);
          linksG.selectAll('.blur').classed('blur', false);
          if (ui.item && ui.item.value) {
            var selectNodeType = ntMap ? "image.node" : "circle.node";
            nodesG.selectAll(selectNodeType)
            .filter(function (d, i) {
              var foundDatum = (ui.item.value !== "" && d[id] !== undefined && d[name] !== ui.item.value);
              if (!foundDatum) {
                var svgPan = document.getElementById("link-explorer");        
                var viewBoxM = svgPan.getAttribute("viewBox");
                var viewBoxValuesM = viewBoxM.split(' ');
                
                viewBoxValuesM[0] = d.x - 200;
                viewBoxValuesM[1] = d.y - 200;
                svgPan.setAttribute('viewBox', viewBoxValuesM.join(' '));
              }
              return foundDatum;
            })
            .classed("blur", true);
            linksBlurred = true;
            
            linksG.selectAll('line.link').classed('blur', true);
          } else {
            linksBlurred = false;
          }
        }
      });
      */
      force
        .nodes(force.nodes())
        .links(force.links())
        .gravity(0.1)
        .charge(-2000)
        .friction(0.1999999999999)
        .linkDistance(function (link, i) {
          if (link[forward] && link[forward][frwdSubsystem])
            return 80;
          return 160;
        })
        .start();
    
      var link = linksG.selectAll("line.link")
        .data(force.links(), function (d) {
          return d[sourceId] + '-' + d[targetId];
        });
      
      link.enter()
        .insert("line", "g")
        .attr("class", function (d) {
          var reverseClass = " reverse";
          if (d.reverse === null) {
            reverseClass = "";
          }
          var classValue = "link from-" + d.source.id + " to-" + d.target.id + reverseClass;
          return classValue;
        })
        .attr("x1", function(d) {
          return d.source.x;
        })
        .attr("y1", function(d) {
          return d.source.y;
        })
        .attr("x2", function(d) {
          return d.target.x;
        })
        .attr("y2", function(d) {
          return d.target.y;
        })
        .attr("linkType", function (d) {
          return d[forward] && d[forward][frwdLinkType] ? d[forward][frwdLinkType] : 0;
        })
        .style("stroke", function (d) {
          return linkColor(d[forward] && d[forward][frwdLinkType] ? d[forward][frwdLinkType] : 0);
        })
        .style("stroke-width", function (d) {
          return d[forward] && d[forward][frwdLinkType] ? d[forward][frwdLinkType] + linkWidth : 0;
        })
        .on('mouseover', function (d) {
            console.dir(d);
            console.log(sourceId + "|" + targetId);
          var blurredLink = linksG.selectAll('.link.from-' + d[sourceId] + '.to-' + d[targetId]).classed('blur');
          
          /*if (!blurredLink) {
            if (d[forward][frwdDetailURL] !== null) {
              detalViewer && detailViewer.show(d[forward][frwdDetailURL], d.source.name + ' -> ' + d.target.name);
            }
            
            if (d[reverse]) {
              if (d[reverse].detailURL !== null) {
                detalViewer && detailViewer.show(d[reverse][revDetailURL], d.target.name + ' -> ' + d.source.name);
              }
            }
          }*/
        })
        .call(force.drag);
      
      link.exit().remove();

      var node = null;
      if (ntMap) {
        node = nodesG.selectAll("image.node")
          .data(force.nodes(), function (d) {
            return d[id];
          });
        
        node.enter().append("image")
          .attr("class", function (d) {
            return "node " + d[id];
          })
          .attr("xlink:href", function (d) {
            return ntMap[d[nodeType]];
          })
          .attr("x", -16)
          .attr("y", -16)
          .attr("width", 32)
          .attr("height", 32)
          .on('click', function (d) {
            if (d3.event.shiftKey) {
              _processSubsystem(d);
            } else {
              if (d.subsystem) {
                alert('Subsystems are hidden!  Please open the subsystems by Shift + click.  Then do a normal click!')
              } else {
                PubSub.publish("link-explorer-node-click", d[id]);
              }
            }
          })
          .on('mouseover', function (d) {
            var selectedFromLinks = selectFromLinks(d);
            var selectedToLinks = selectToLinks(d);
            
            blurredNode = nodesG.selectAll('image.node.' + d.id).classed('blur');
            if (!blurredNode) {
              selectedFromLinks.attr("marker-end", "url(#Triangle)").classed("hidden", false).classed("bold", true).classed('blur', false);
              selectedToLinks.attr("marker-end", "url(#Triangle)").classed("hidden", false).classed("bold", true).classed('blur', false);
              nodesG.selectAll('image.node').classed('blur', false);
              linksG.selectAll("line.link").classed('blur', false);
              nodesG.selectAll("image.node." + d[id]).style("stroke", "#000000;").style("stroke-width", "3px");
              
              selectReverseLink(d).attr("marker-start", "url(#RevTriangle)");
              
              if (d[detailUrl]) {
                detalViewer && detailViewer.show(d[detailUrl], d[name]);
              }
            }
          })
          .on("mouseout", function (d) {
            var blurredNode = nodesG.selectAll('image.node.' + d[id]).classed('blur');
            selectFromLinks(d).attr("marker-end", null).classed("bold", false).classed('blur', blurredNode);
            selectToLinks(d).attr("marker-end", null).classed("bold", false).classed('blur', blurredNode);
            selectReverseLink(d).attr("marker-start", null);
            nodesG.selectAll("image.node." + d[id]).style("stroke-width", "0px");
          })
          .call(force.drag);
      } else {
        node = nodesG.selectAll("circle.node")
          .data(force.nodes(), function (d) {
            return d[id];
          });
        
        node.enter().append("circle")
          .attr("class", function (d) {
            return "node " + d[id];
          })
          .style("fill", function (d) {
            return nodeColor(d[nodeType]);
          })
          .style("stroke", function (d) {
            return d3.rgb(nodeColor(d[nodeType])).darker();
          })
          .attr("filter", "url(#sofGlow)")
          .style("stroke-width", "0px")
          .attr("r", 16)
          .on('click', function (d) {
            if (d3.event.shiftKey) {
              _processSubsystem(d);
            } else {
              if (d.subsystem) {
                alert('Subsystems are hidden!  Please open the subsystems by Shift + click.  Then do a normal click!')
              } else {
                PubSub.publish("link-explorer-node-click", d[id]);
              }
            }
          })
          .on('mouseover', function (d) {
            var selectedFromLinks = selectFromLinks(d);
            var selectedToLinks = selectToLinks(d);
            
            blurredNode = nodesG.selectAll('circle.node.' + d.id).classed('blur');
            if (!blurredNode) {
              selectedFromLinks.attr("marker-end", "url(#Triangle)").classed("hidden", false).classed("bold", true).classed('blur', false);
              selectedToLinks.attr("marker-end", "url(#Triangle)").classed("hidden", false).classed("bold", true).classed('blur', false);
              nodesG.selectAll('circle.node').classed('blur', false);
              linksG.selectAll("line.link").classed('blur', false);
              nodesG.selectAll("circle.node." + d[id]).style("stroke", "#000000;").style("stroke-width", "3px");
              
              selectReverseLink(d).attr("marker-start", "url(#RevTriangle)");
              
              if (d[detailUrl]) {
                detalViewer && detailViewer.show(d[detailUrl], d[name]);
              }
            }
          })
          .on("mouseout", function (d) {
            var blurredNode = nodesG.selectAll('circle.node.' + d[id]).classed('blur');
            selectFromLinks(d).attr("marker-end", null).classed("bold", false).classed('blur', blurredNode);
            selectToLinks(d).attr("marker-end", null).classed("bold", false).classed('blur', blurredNode);
            selectReverseLink(d).attr("marker-start", null);
            nodesG.selectAll("circle.node." + d[id]).style("stroke-width", "0px");
          })
          .call(force.drag);
      }
      var showText = jQuery('.show-text').is(':checked');
      
      node.enter().append("text")
        .attr('class', 'node')
        .attr('x', function (d) {
          return d.x;
        })
        .attr('y', function (d) {
          return d.y;
        })
        .style('display', function (d) {
          return showText ? "block" : "none";
        })
        .text(function (d) { 
          return d[name];
        });
      
      node.exit().remove();
    }
    
    function createDefs(svg) {
      var defsTri = svg.append("svg:defs");
      defsTri.append("svg:marker")        
        .attr("id", "Triangle")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 17)
        .attr("refY", 5)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", 11*2)
        .attr("markerHeight", 10*2)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z");
      
      var defsRevTri = svg.append("svg:defs");
      defsRevTri.append("svg:marker")        
        .attr("id", "RevTriangle")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", -8)
        .attr("refY", 5)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", 11*2)
        .attr("markerHeight", 10*2)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M 10 10 L 0 5 L 10 0 z");

        var defGlow = svg.append("svg:defs");
        var defGlowFilter = defGlow.append("svg:filter")
            .attr("id", "sofGlow")
            .attr("height", "300%")
            .attr("width", "300%")
            .attr("x", "-75%")
            .attr("y", "-75%")
        defGlowFilter.append("feMorphology")
            .attr("operator", "dilate")
            .attr("radius", 3)
            .attr("in", "SourceAlpha")
            .attr("result", "thicken");
        defGlowFilter.append("feGaussianBlur") 
            .attr("in", "thicken")
            .attr("stdDeviation", 10)
            .attr("result", "blurred");
        defGlowFilter.append("feFlood")
            .attr("flood-color", "rgb(0,186,255)")
            .attr("result", "glowColor");
        defGlowFilter.append("feComposite")
            .attr("in", "glowColor")
            .attr("in2", "blurred")
            .attr("operator", "in")
            .attr("result", "softGlow_colored");
        defGlowFilterMerge = defGlowFilter.append("feMerge");
        defGlowFilterMerge.append("feMergeNode")
            .attr("in", "softGlow_colored");
        defGlowFilterMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");
    }
    
    function _render(data) {
      vis = d3.select(chartTagId)
        .append("svg")
        .attr("id", "link-explorer")
        .attr("class", "link-explorer")
        .attr("width", w)
        .attr("height", h)
        .attr("viewBox", "0 0 " + w + " " + h)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .append("g")
        .call(zoom.on('zoom', redraw));

      //SVG Definition for arrow head 
      createDefs(vis);
      
      linksG = vis.append("g").attr("id", "links");
      nodesG = vis.append("g").attr("id", "nodes");

      force = d3.layout.force().size([w, h]);
      
      force.on("tick", function() {
        linksG.selectAll("line.link").attr("x1", function(d) {
          return d.source.x;
        }).attr("y1", function(d) {
          return d.source.y;
        }).attr("x2", function(d) {
          return d.target.x;
        }).attr("y2", function(d) {
          return d.target.y;
        });

        if (ntMap) {
          nodesG.selectAll("image.node")
            .attr("transform", function (d) {
              return "translate(" + d.x + ", " + d.y + ")";
            });
        } else {
          nodesG.selectAll("circle.node")
            .attr("cx", function (d) {
              return d.x;
            })
            .attr("cy", function (d) {
              return d.y;
            });
        }

        nodesG.selectAll("text.node")
          .attr("x", function (d) {
            return d.x;
          })
          .attr("y", function (d) {
            return d.y;
          });
      });
      
      jQuery('.show-text').click(function () {
        if (this.checked) {
          nodesG.selectAll("text.node").style('display', 'block');
        } else {
          nodesG.selectAll("text.node").style('display', 'none');
        }
      });

      _update(data);
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
      }
    }
    
    return {graph: graph};
  }
  
  return {Runner: Runner}
})(jQuery, d3, PubSub);