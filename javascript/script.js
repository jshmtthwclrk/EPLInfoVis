var clSelected = false;
var holdSelected = false;
var relegatedSelected = false;

var margin = {top: 150, right: 200, bottom: 30, left: 100},
width = 1300 - margin.left - margin.right,
height = 720 - margin.top - margin.bottom;


var timeline = {
g: null,
height: 80,
width: width
};

// add the graph canvas to the body of the webpage
var svg = d3.select("body").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
//.call(d3.behavior.zoom()/*.x(xScale).y(yScale)*/.scaleExtent([1, 6]).on("zoom", zoom/*ed*/))
//.append("g")
//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");    


timeline.g = svg.append("g")
.attr("class", "timeline")
.attr("width", timeline.width)
.attr("transform", "translate(0," + (height - timeline.height) + ")");

/* 
* value accessor - returns the value to encode for a given data object.
* scale - maps value to a visual display encoding, such as a pixel position.
* map function - maps from data value to display value
* axis - sets up axis
*/ 


//Actual graph
// setup x 
var xValue = function(d) { return d.Points;}, // data -> value
xScale = d3.scale.linear().range([0, width]), // value -> display
xMap = function(d) { return xScale(xValue(d));}, // data -> display
xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function(d) { return d["Net Spending"];}, // data -> value
yScale = d3.scale.linear().range([height, 0]), // value -> display
yMap = function(d) { return yScale(yValue(d));}, // data -> display
yAxis = d3.svg.axis().scale(yScale).orient("left");

var rValue = function(d) { return d["Gross Spending"];},
rMap = function(d) { 
if(rValue(d) == 0) 
	return 5;
else
{
	var size = rValue(d)/2000000;
	if(size <= 5)
		return 5;
	else if(size >=60)
		return 60;
	else 
		return size;
}	
	
	
	

};

// setup fill color
var cValue = function(d) { 
return d["Table Standing"];},

//color = d3.scale.category20();
color = d3.scale.ordinal()

.range(["#FFFF66","#CCFFFF  ","#FF9933"])
.range(["#f0c609","#00184a","#e6002c"/*"#FFFF66","#CCFFFF","#FF9933"*/])
.domain(["Champion's League", "Hold League", "Relegation"]);




//-------------------timeline x and y axis setup---------------------------
var x = d3.time.scale()
.range([0,timeline.width])
.clamp(true);

var y = d3.scale.linear()
.range([timeline.height, 0]);


// var xAxis2 = d3.svg.axis()
// .scale(x)
// // .ticks(d3.time.year, 12)
// // .tickSize(10, 1)
// //.tickFormat(d3.time.format('%y'))
// .orient("top");

var brush = d3.svg.brush()
.x(x)
.on("brush",update)
.on("brushend",brushedend);


//-----------------------------------------------------------------------
// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
	// .attr("width", 70)
	// .attr("height", 100)
	.attr("class", "tooltip")
	.style("background-color", "#FFFFFF")
	.style("opacity",0);


var spending;
var slider;
var dots;

// load data
d3.csv("Stats.csv.csv", function(error, data) {


	spending = data;
	// change string (from CSV) into number format

	data.forEach(function(d) {
		d["Net Spending"] = parseInt(d["Net Spending"].replace(/,/g, ''));
		d.POS = +d.POS;
		d["Season"] = (d["Season"].split("-",1));
	});

	// don't want dots overlapping axis, so add in buffer to data domain
	xScale.domain([0, d3.max(data, xValue)]);//this apparently fixed the x-axis issue 
	yScale.domain([-70000000,170000000]);


	// x-axis
	svg.append("g")
		.attr("class", "x axis")
		.style("fill", "#484848 "  )
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.append("text")
		.attr("class", "label")
		.attr("x", width)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text("Points");

	// y-axis
	svg.append("g")
		.attr("class", "y axis")
		.style("fill", "#484848 "  )
		.call(yAxis)
		.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Net Spending");

	// console.log(data);

	drawDots(data);


	// draw legend
	var legend = svg.selectAll(".legend")
	.data(color.domain())
	.enter().append("g")
	.attr("class", "legend")
	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	// draw legend colored rectangles
	legend.append("rect")
	.attr("x", width + 170)
	.attr("width", 18)
	.attr("height", 18)
	.on("mouseover", function(d) {
		if(d == "Champion's League"){
			d3.selectAll('.dot').style("opacity", function(d1){
				if (d1['Table Standing'] !== d){return 0.1;} 
				else{return 1;}
			});
		}
		if(d == "Relegation"){
			d3.selectAll('.dot').style("opacity", function(d1){
				if (d1['Table Standing'] !== d){return 0.1;} 
				else{return 1;}
			});
		} 
		if(d == "Hold League"){
			d3.selectAll('.dot').style("opacity", function(d1){
				if (d1['Table Standing'] !== d){return 0.1;} 
				else{return 1;}
			});
		}
	})
	.on("mouseout", function(d) {

	clSelected = false;
	holdSelected = false;
	relegatedSelected = false;

	svg.selectAll(".dot").transition()
	.duration(100)
	.style("opacity", 1);

	})
	.style("fill", color);

	// draw legend text
	legend.append("text")
	.attr("x", width + 160)
	.attr("y", 9)
	.attr("dy", ".35em")
	.style("text-anchor", "end")
	.style("fill", "#484848 "  )
	.text(function(d) { return d;})

	//--------------------- slider ------------------------------
	var domain = d3.extent(data, function(d) { return d["Season"]; });
	var offset = d3.time.year.offset;
	x.domain([offset(domain[0], 31), offset(domain[1], 41)]);
	y.domain([0, 50]);  

	// Axis
	// timeline.g.append("g")
	// .attr("class", "x axis")
	// .attr("transform", "translate(0," + timeline.height + ")")
	// .call(xAxis2);

	brush.extent([offset(data[0]["Season"], 31), data[21]["Season"]]);

	slider = timeline.g.append("g")
	.attr("class", "brush")
	.call(brush);

	slider.selectAll(".resize,.background")
	.remove();

	slider.selectAll("rect")
	.attr("height", timeline.height + 6)
	.attr("width", 50)
	.attr("y", -5);

	slider.append("text")
	.style("text-anchor", "right")
	.attr("y", 10)
	.attr("x", x(data[0]["Season"]))
	.style("stroke", "none")
	.style("fill", "Black")
	.style("font-weight", "bold")
	.style("font-size", "15px")
	.text(data[0]["Season"]);

});	


function brushedend() {
	var extent0 = brush.extent(),extent1;

	var d0 = d3.time.year.floor(extent0[0]);
	d0 = d3.time.year.offset(d0, 1);
	var d1 = d3.time.year.offset(d0, 1);
	extent1 = [d0, d1];

	d3.select(this).call(brush.extent(extent1));

	update();
}

function drawDots(dataset){
	
	// console.log(dataset);
	dots = svg.selectAll(".dot")
			.data(dataset, function(d) {return d['Net Spending'];});
	
	dots.exit().remove();

	dots.enter().append("circle")
		.attr("class", "dot")
		.attr("r", rMap)
		//.attr("transform", function(d) { return "translate(" + d + ")"; })
		.attr("cx", xMap)
		.attr("cy", yMap)
		.style("fill", function(d) {  return color(cValue(d));
		}) 
		.on("mouseover", function(d) {
			d3.select(this).style("opacity", 0.6);
			tooltip.transition()
			.duration(200)
			.style("opacity", 0.9);
			tooltip.html(d["TEAM"] + "<br/>" + xValue(d) 
				+ " Points<br/>Gross £ " + rValue(d) + " "
				+ " <br/>Net £ " + yValue(d) + " ")
			.style("left", (d3.event.pageX + 5) + "px")
			.style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
			d3.select(this).style("opacity", 1);	
			tooltip.transition()
			.duration(500)
			.style("opacity", 0);
		});
}


function update() {

	var index = (((brush.extent()[0]).getFullYear()) - 2001)*20;
	console.log(index + ' ' + (index + 20));
	var sel = spending[index];

	var  arr = [];
	for (i = index; i < index+20; i++) 
	{ 
		arr.push(spending[i]);
	}
	drawDots(arr);

	var tx = x(d3.time.year.offset(brush.extent()[0], 0))
	var yr = brush.extent()[0].getFullYear();
	slider.select("text").text(yr+"-"+(yr+1)).attr("x", tx);
}


function zoom() {
svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
/*svg.select(".xScale.axis").call(xAxis);
svg.select(".yScale.axis").call(yAxis);*/
}