var color = function() {
	var r = Math.round(Math.random() * 155 + 100);
	var g = Math.round(Math.random() * 155 + 100);
	var b = Math.round(Math.random() * 155 + 100);
	return "rgb(" + r + "," + g + "," + b + ")";
};
var shuffle = function(o) {
	for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};
(function() {
	var width = 1200,
		height = 960;
	var axePosition = {
		x1: 0,
		y1: 100,
		x2: width,
		y2: 100
	};
	var timeAxe = new Axe();
	timeAxe.setPosition(axePosition.x1, axePosition.y1, axePosition.x2, axePosition.y2);
	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', width);
	svg.setAttribute('height', height);
	var graph = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	graph.appendChild(timeAxe.g);
	svg.appendChild(graph);
	document.getElementsByTagName('body')[0].appendChild(svg);
	d3.json("data/data.json", function(data) {
		console.log(data)
	});
}())