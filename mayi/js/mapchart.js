        var width = 1000;
        var height = 700;

        var svg = d3.select("#mapchart")
                    .append("svg") 
                    .attr("width", width)
                    .attr("height", height);
        
        var tooltip = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip");

        var density_g = svg.append("g");

        var projection = d3.geoMercator()

        var geoGenerator = d3.geoPath()
            .projection(projection);

        var colorScale = d3.scaleOrdinal(d3.schemeCategory20b);
        var colorScale2 = d3.scaleQuantile().range(["#b6e0ff", "#99bfff", "#759cff", "#c4b2ff", "#edb2ff", "#ffdae9"]);

        // we use queue because we have 2 data files to load.
        queue()
            .defer(d3.json, "data/countries.geo.json")
            .defer(d3.csv, "data/Youth_literacy_rate.csv", typeAndSet)
            .await(loaded);

        var countryByName = d3.map();

        function typeAndSet(d){
            d.year2018 = +d.year2018;
            countryByName.set(d.Country_name, d)
            return d;
        }

        function getColor(d){
            var country = countryByName.get(d.properties.name);
            // console.log(country)

            if(country){
//              console.log(colorScale2(country.year2018))
                return colorScale2(country.year2018);
            }else if(d.properties.name!="Antarctica"){
                return "#ccc";
            }else{
                return "#fff";
            }
        }

        function getCol(matrix, col){
           var column = [];
           for(var i=0; i<matrix.length; i++){
              column.push(matrix[i][col]);
           }
           return column;
        }

        function loaded(error, density, gdp){
            if(error) throw error;
            
            console.log(gdp);

            // colorScale2.domain(d3.extent(gdp, function(g){
            //  return g.year2018;
            // }))
            colorScale2.domain(getCol(gdp, 'year2018'))
            console.log(getCol(gdp, 'year2018'))
            // colorScale2.domain([0, 10, 100, 1000, 20000])

            projection.fitSize([1000, 1000], density);

            var density = density_g.selectAll("path")
                .data(density.features);

            density.enter()
                .append("path")
                .attr("d", geoGenerator)
                // .attr("fill", function(d,i){ return colorScale(i); })
                .attr("fill", function(d){ return getColor(d); })
                .on("mouseover", mouseoverFunc) 
                .on("mousemove", mousemoveFunc) 
                .on("mouseout", mouseoutFunc); 

            // The d3-legend component is called here:

            var linear = colorScale2;

            svg.append("g")
                .attr("class", "legendLinear")
                .attr("transform", "translate(20,20)");

            // var legendLinear = d3.legendColor()
            //     .shapeWidth(30)
            //     .orient("vertical")
            //     .labelFormat(d3.format(".0f"))
            //     .scale(linear);

            // svg.select(".legendLinear")
            //     .call(legendLinear);

        }
        function mouseoverFunc(d) {
            
            if (d.properties.name!="Antarctica"){
                d3.select(this)
                .transition()
                .duration(100)
                .style("stroke-width", 1.5)
                .style("stroke", "white"); 
                
                if (countryByName.get(d.properties.name)){
                tooltip
                .style("display", null) 
                .text( d.properties.name + "的青年识字率是" + countryByName.get(d.properties.name)["year2018"]);
                }else{
                tooltip
                .style("display", null)
                .text( d.properties.name + "数据缺失");
                }
            }
           
                
        }

            function mousemoveFunc(d) {
            tooltip
                .style("top", (d3.event.pageY + 10) + "px" )
                .style("left", (d3.event.pageX + 15) + "px");
        }

            function mouseoutFunc(d) {
                if (d.properties.name!="Antarctica"){
                d3.select(this)
                .transition()
                .duration(100)
                .style("stroke-width", 1)
                .style("stroke", "white"); 
            tooltip.style("display", "none");
            d3.select(this) }

        }
