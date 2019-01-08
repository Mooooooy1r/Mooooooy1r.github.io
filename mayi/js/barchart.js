     var fullwidth = 1000,
            fullheight = 500;

        var margin = {top: 20, right: 100, bottom: 30, left: 60},
            width = fullwidth - margin.left - margin.right,
            height = fullheight - margin.top - margin.bottom;

        var svg = d3.select("#barchart")
                .append("svg")
                .attr("width", fullwidth )
                .attr("height", fullheight)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xScale = d3.scaleBand()
                .range([0, width])
                .padding(.5);

        var yScale = d3.scaleLinear()
                .range([height, 0]);

        var colorScale = d3.scaleOrdinal(d3.schemeCategory20b); //
        var xAxis = d3.axisBottom(xScale).ticks(10);
        var yAxis = d3.axisLeft(yScale);

        var formatDate = d3.timeFormat("%Y");
        var parseDate = d3.timeParse("Year %Y");

        //用于处理数据，把数据做成直接能画area的状态
        var stack = d3.stack()

        var tooltip = d3.select("body").append("div").classed("tooltip", true);

        d3.csv("data/out_of_school_population.csv", function(error, data) {

            if (error) { console.log(error); };

            //如果你的数据是wide data可能会方便很多
            var dataset =  d3.nest()
                .key(function(d) { return d.Year; }).sortKeys(d3.ascending)

                //long data to wide data: http://jonathansoma.com/tutorials/d3/wide-vs-long-data/ 

                .rollup(function(d) { // do this to each grouping
                    // reduce takes a list and returns one value
                    // in this case, the list is all the grouped elements
                    // and the final value is an object with keys
                    return d.reduce(function(prev, curr) {
                      prev["Year"] = curr["Year"];
                      prev[curr["Gender"]] = curr["Population"];
                      return prev;
                    }, {});
                })
                .entries(data)
                .map(function(d) { 
                        return d.value;
                      });

            console.log("wide dataset", dataset)

            var gender = ["Girls","Boys"]

            stack.keys(gender)
                .order(d3.stackOrderDescending)
                .offset(d3.stackOffsetNone)
                // .offset(d3.stackOffsetExpand) // normalize

            var layers = stack(dataset);

            console.log("stacked layers", layers)

            var maxY = d3.max(
                layers,  function(l){
                    return d3.max(l, function(d) { return d[1]; })
                }
            )
            xScale.domain(dataset.map(function(d){ return d.Year;} ))
            yScale.domain([0, maxY]);

            var series = svg.selectAll(".layer")
                .data(layers) 
                .enter().append("g")
                .attr("fill", function(d) { return colorScale(d.key); });

            series
                .selectAll("rect.layer")
                .data(function(d){ return d; })
                .enter().append("rect")
                .attr("class","layer")
                .attr("x",function(d) { return xScale(d.data.Year); })
                .attr("y",function(d) { return yScale(d[1]); })
                .attr("width", xScale.bandwidth())
                //lower value的坐标 - higher value的坐标就是rect的height啦！
                .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]) ; })
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseout", mouseout);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            // 图例 legend, based on http://bl.ocks.org/mbostock/3886208

            // layers的数据顺序并不是从0到max去排的，所以我们需要先手动排一下
            layers.sort(function(a,b){
                return a[0][0] - b[0][0];
            })
            var layers_key = layers.map(function(l){ return l.key; })

            // 数据的顺序是从基线往上，但我们给legend需要从上往下，所以要.reverse()
            var legend_order = layers_key.slice().reverse();

            console.log("legend_order",legend_order);

            var legend = svg.selectAll(".legend")
                .data(legend_order)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });//????????20

            legend.append("rect")
                .attr("x", width)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", function(d) {return colorScale(d);}); // country name

            legend.append("text")
                .attr("x", width + 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "start")
                .text(function(d, i) { return legend_order[i]/*.replace(/_/g, " ");*/ });
        
        });
        function mouseover(d) {

          d3.select(this)
            .transition()
            .style("stroke", "black");
            var parent = d3.select(this).node().parentNode.__data__;
            // console.log(parent)
          tooltip
            .style("display", null) 
            .html("<p>Gender: " + parent.key + 
                  "<br>Population: " + (d[1]-d[0]) +
                 /* "<br>Year: " + formatDate(parseDate(d.data.Year)) +*/ " </p>");
        }

        function mousemove(d) {
          tooltip
            .style("top", (d3.event.pageY - 10) + "px" )
            .style("left", (d3.event.pageX + 10) + "px");
          }

        function mouseout(d) {
          d3.select(this)
            .transition()
            .style("stroke", "none");

          tooltip.style("display", "none");  
        }