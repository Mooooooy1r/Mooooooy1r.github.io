			function linechart(){
			var fullwidth = 1000;
			var fullheight = 500;
			var margin = { top: 20, right: 120, bottom: 20, left: 70 };


			var width = fullwidth - margin.left - margin.right;
			var height = fullheight - margin.top - margin.bottom;

			var svg_line = d3.select("#linechart")
						.append("svg")
						.attr("width", fullwidth)
						.attr("height", fullheight)
						.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var timeParse = d3.timeParse("%Y");
			var timeFormat = d3.timeFormat("%Y年");

			var xScale = d3.scaleTime()
								.range([0, width]);

			var yScale = d3.scaleLinear()
								.range([0, height]);

			var xAxis = d3.axisBottom(xScale)
							.tickFormat(function(d) {
								return timeFormat(d);
							})
							.ticks(15);

			var yAxis = d3.axisLeft(yScale);

			var line = d3.line()
				.x(function(d) {
					return xScale(timeParse(d.year));
				})
				.y(function(d) {
					return yScale(+d.amount);
				})
				.curve(d3.curveCardinal);

			var radius = 3;

			var tooltip = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip");


			

			d3.csv("data/Number.csv", function(error, data) {
				if (error) throw error;

				var years = d3.keys(data[0]).slice(0, 32-1); 
				var dataset = [];

				data.forEach(function(d){

					var myEmissions = [];

					years.forEach(function(y){
						if (d[y]) { 
							myEmissions.push({
								country: d.countryName,
								year: y,
								amount: + d[y]
							})
						}
					})

					dataset.push({
						country: d.countryName,
						emissions: myEmissions
					})
				})


				xScale.domain(
					d3.extent(years, function(d) {
						return timeParse(d);
					}));

				yScale.domain([
					d3.max(dataset, function(d) {
						return d3.max(d.emissions, function(d) {
							return d.amount;
						});
					}),
					0
				]);

				var groups = svg_line.selectAll("g")
					.data(dataset)
					.enter()
					.append("g");


				groups.selectAll("path")
					.data(function(d) { 
						return [ d.emissions ]; 
					})
					.enter()
					.append("path")
					.attr("class", "line")
					.attr("d", line);

//1. comment掉简陋的title

				/*groups.append("title")
					.text(function(d) {
						return d.country;
					});*/

//2. 在group上加label

				// 为什么在groups上面加？
				// 因为数据已经在groups里啦！

				groups.append("text")
					.attr("x", function(d) {
						if (d.emissions.length != 0) {
					  	var lastYear = d.emissions[d.emissions.length-1].year;
					  	return xScale(timeParse(lastYear));
					  }
					})
					.attr("y", function(d) {
						if (d.emissions.length != 0) {
					  	var lastAmount = d.emissions[d.emissions.length-1].amount;
					  	return yScale(lastAmount);
						}
					})
					.attr("dx", "3px")
					.attr("dy", "3px")
					.text(function(d) {
						if (d.emissions.length != 0) {
							var lastAmount = d.emissions[d.emissions.length-1].amount;
							if (+lastAmount > 1) {
								return d.country;
							}
						}
					})
					.attr("class", "linelabel");

//3. 在group上加mouseover
				
				groups.on("mouseover", mouseoverGroup)
					  .on("mouseout", mouseoutGroup)

//4. circles on lines
				var radius = 3;

				var circles = groups.selectAll("circle")
					.data(function(d) { 
								return d.emissions; 
					})
					.enter()
					.append("circle");

				circles.attr("cx", function(d) {
						return xScale(timeParse(d.year));
					})
					.attr("cy", function(d) {
						return yScale(d.amount);
					})
					.attr("r", radius)
					.attr("opacity", 0); // 线这么多，dot最好opacity 0

				circles
					.on("mouseover", mouseoverCircle)
					.on("mousemove", mousemoveCircle)
					.on("mouseout",	mouseoutCircle);

// axis here: 
				svg_line.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				svg_line.append("g")
					.attr("class", "y axis")
					.call(yAxis);


			}); 

//3.2. mouseover on groups:
	
			function mouseoverGroup(d){
				// the "this" is the g parent node.  That means we can select it, and then select
				// the child nodes and style the]m as we want for the hover effect!
				d3.select(this).select("path").attr("id", "focused"); // overrides the class
				d3.select(this).select("text").classed("hidden", false);  // show it if "hidden"
				d3.select(this).select("text").classed("bolder", true);
			}

			function mouseoutGroup(d){
				d3.select(this).select("path").attr("id", null); // remove the focus style
				d3.select(this).select("text").classed("bolder", false); // remove the bolding on label
			}

//4.2. mouseover on circles:

			function mouseoverCircle(d) {

				d3.select(this)
					.transition()
					.style("opacity", 1)
					.attr("r", radius * 1.5);

				// 给circle所在的line加highlight
				// var lineid = d3.select(this).attr("id");
				// d3.select("path#" + lineid).classed("focused", true).classed("unfocused", false);

				tooltip
					.style("display", null) 
					.html(
						"<p>" + d.year +
						"年<br> " + d.amount + " 百万人</p>"
						);
			}

			function mousemoveCircle(d) {
				tooltip
					.style("top", (d3.event.pageY - 10) + "px" )
					.style("left", (d3.event.pageX + 10) + "px");
				}

			function mouseoutCircle(d) {
				d3.select(this)
					.transition()
					.style("opacity", 0)
					.attr("r", 3);

				d3.selectAll("path.line").classed("unfocused", true).classed("focused", false);

		    	tooltip.style("display", "none");  
		    }
		    }
		    linechart();