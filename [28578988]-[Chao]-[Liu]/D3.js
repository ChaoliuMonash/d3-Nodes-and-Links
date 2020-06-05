
window.onload=function() {
    var svgCanvas = d3.select("svg")

//create print pad

    var height = 864;
    var width = 1536;
    var border = 1;
    var bordercolor = "gray";


//create svg container
//reference:https://www.dashingd3js.com/svg-basic-shapes-and-d3js
//reference:https://stackoverflow.com/questions/15573594/creating-a-border-around-your-d3-graph
    var svg = d3.select("body")
        .append("svg")
        .attr("height", height)
        .attr("width", width)
        .attr("border", border);

//creat border attribites
    var borderPath = svg.append("rect")
        .attr("height", height)
        .attr("border", border)
        .attr("x", 0)
        .attr("y", 0)
        .style("fill", "gray")
        .style("stroke", bordercolor)
        .style("stroke-width", border);


//div
    var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    var nodeS = d3.scaleLinear().range([15, 80]);
    var linkS = d3.scaleLinear().range([5, 35]);
    var colorS = d3.scaleOrdinal(d3.schemeCategory10);


//main function


    d3.json("data.json").then(function(data) {

        console.log(data)
        var nodes = data.nodes;
        var links = data.links;

        links.forEach(function (link) {

            link.target = link.node02;
            link.source = link.node01;
            nodes.forEach(function (node) {
                if (node.id == link.target) {
                    if (node.nLinked == null) {
                        node.nLinked = 1;
                    }
                    node.nLinked = node.nLinked + 1;
                }
                if (node.id == link.source) {
                    if (node.nLinked == null) {
                        node.nLinked = 0;
                    }
                    node.nLinked += 1;
                }
            })

        });

        //SumAmount function
        function sumAmount(nodeName) {
            var sum = 0;
            links.forEach(function (link) {
                if (link.target == nodeName || link.source == nodeName) {
                    sum += link.amount //sum = sum + link.amount
                }
            })
            return sum;
        }

        nodes.forEach(function (d) {
            d.amount = sumAmount(d.id)
        })


        //scale domain
        //reference:https://observablehq.com/@d3/d3-extent
        //reference:https://stackoverflow.com/questions/25161867/how-do-i-use-d3-domain-to-get-d3-min-and-d3-max-from-multiple-columns-in-a-json
        nodeS.domain([d3.min(nodes, d => d.amount), d3.max(nodes, d => d.amount)]);
        linkS.domain([d3.min(links, d => d.amount), d3.max(links, d => d.amount)]);


        //simulation for force
        //reference:http://bl.ocks.org/jose187/4733747
//reference:https://bl.ocks.org/d3indepth/c48022f55ebc76e6adafa77cf466da35
//https://github.com/d3/d3-force/issues/120
        var force = d3.forceSimulation()
            .force("link", d3.forceLink().distance(300).id(function (d) {
                return d.id;
            }))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(150))
            .velocityDecay(0.4)
            .alphaTarget(0.1);


        //draw nodes
        var node = svg.append("g")
            .attr("class", "node")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("name", function (d) {
                return d.id;
            })
            .attr("r", function (d) {
                return nodeS(d.amount)
            })
            .attr("fill", function (d) {
                return colorS(d.id)
            })

            .on('mouseover', mouseOver(.4))
            .on('mouseout', mouseOut);

        //draw links
        //reference:https://stackoverflow.com/questions/30303247/add-links-to-my-nodes-with-d3-js
        var link = svg.append("g")
            .selectAll(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke-width", function (d) {
                return linkS(d.amount)
            })
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke", "lightgray");

        force.nodes(nodes)
            .on("tick", ticks);
        force.force("link")
            .links(links);

        //ticks
        //reference:Cuesta, H., & Kumar, S. (2016). Practical Data Analysis. Packt Publishing Ltd.
        function ticks() {
            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                })
            node
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                })
        };

        //Dictionary of nodes
        var linkedDic = {};
        links.forEach(function (d) {
            linkedDic[d.source.index + "," + d.target.index] = 1;
        });

        //check the dictionary id connection
        function ifConnected(a, b) {
            return linkedDic[a.index + ',' + b.index] || a.index == b.index
        };


        //Reference https://medium.com/@kj_schmidt/show-data-on-mouse-over-with-d3-js-3bf598ff8fc2
        // handleMouseOver and Out function
        //reference:https://stackoverflow.com/questions/30066259/d3-js-changing-opacity-of-element-on-mouseover-if-condition-false
        //reference:https://stackoverflow.com/questions/16256454/d3-js-position-tooltips-using-element-position-not-mouse-position
        function mouseOver(opacity) {
            return function (d) {
                div
                    .transition()
                    .duration(100)
                    .style("opacity", 0.9)


                //change the opacity according to the node connection checking result.

                node.style("fOpacity", function (o) {
                    Opacity = ifConnected(d, o) ? 1 : opacity;
                    return Opacity;
                });

                node.style("sOpacity", function (o) {
                    Opacity = ifConnected(d, o) ? 1 : opacity;
                    return Opacity;
                });


                link.style("stroke", function (o) {
                    return o.source === d || o.target === d ? 'lightgreen' : "#FFDAB9";


                });


                link.style("sOpacity", function (o) {
                    return o.source === d || o.target === d ? 1 : opacity;
                });


                div
                    .html('Site Name:' + d.id + "<br><br>Realated Nodes:" + d.nLinked + '<br><br>Sum Amount:' + d.amount)
                    .style('left', d3.event.pageX + 'px')
                    .style('top', (d3.event.pageY - 28) + 'px')


            }
        };

        function mouseOut() {
            div
                .transition()
                .duration(300)
                .style("opacity", 0)
            node.style("fOpacity", 1)
            node.style("sOpacity", 0.9)
            link.style("sOpacity", 0.9)
            link.style("stock", "#FFDAB9")
        }


    }

    )

//
}