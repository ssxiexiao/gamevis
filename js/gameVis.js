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
	d3.json("data/cluster.json", function(json) {
		var globalCluster = [];
		var cluster2Index = {};
		var timestamp = [];
		var clusterSeq = [];
		var sizeArr = [];
		var sizeScale = new Scale();
		var g_fun = [];
		var g0 = [];
		var streamArr = [];
		var padding = 500;
		for (var i = 0; i < json.clusters.length; i++) {
			timestamp.push(json.clusters[i].time);
			clusterSeq.push(json.clusters[i].cluster);
			for (var j = 0; j < json.clusters[i].cluster.length; j++) {
				var id = json.clusters[i].cluster[j].id;
				var size = json.clusters[i].cluster[j].size;
				sizeArr.push(parseInt(size));
				if (!cluster2Index.hasOwnProperty(id)) {
					cluster2Index[id] = globalCluster.length;
					globalCluster.push(id);
				}

			}
		}
		//shuffle(globalCluster);
		//globalCluster = globalCluster.reverse();
		timeAxe.setText(timestamp);
		for (var i = 0; i < timestamp.length; i++) {
			var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', timeAxe.textPosition[i].x);
			line.setAttribute('y1', timeAxe.textPosition[i].y);
			line.setAttribute('x2', timeAxe.textPosition[i].x);
			line.setAttribute('y2', height);
			line.setAttribute('stroke-width', '1px');
			line.setAttribute('stroke', 'black');
			graph.appendChild(line);
		}
		for (var i = 0; i < globalCluster.length; i++) {
			g_fun.push([]);
			for (var j = 0; j < clusterSeq.length; j++) {
				var flag = false;
				for (var k = 0; k < clusterSeq[j].length; k++) {
					if (clusterSeq[j][k].id === globalCluster[i]) {
						g_fun[i].push(parseInt(clusterSeq[j][k].size));
						flag = true;
						break;
					}
				}
				if (!flag) {
					g_fun[i].push(0);
				}
			}
		}
		for (var i = 0; i < g_fun[0].length; i++) {
			g0.push(0);
		}
		for (var i = 0; i < g_fun.length; i++) {
			for (var j = 0; j < g_fun[i].length; j++) {
				g0[j] += padding + g_fun[i][j];
			}
		}
		for (var i = 0; i < g0.length; i++) {
			g0[i] = -0.5 * g0[i];
		}
		calculator.setBaseLine(g0);
		console.log(g0);
		for (var j = 0; j < g_fun[0].length; j++) {
			g_fun[0][j] += g0[j] + padding;
		}
		for (var i = 1; i < g_fun.length; i++) {
			for (var j = 0; j < g_fun[i].length; j++) {
				g_fun[i][j] += g_fun[i - 1][j] + padding;
			}
		}
		sizeScale.setRange({
				min: axePosition.y1 + 10,
				max: height - 10
			})
			.setDomain({
				min: 0,
				max: d3.max(g_fun[g_fun.length - 1])
			});
		for (var i = 0; i < g_fun.length; i++) {
			var stream = new Stream();
			streamArr.push(stream);
			for (var j = 0; j < g_fun[i].length; j++) {
				streamArr[i].yEnd.push(sizeScale.getValue(g_fun[i][j]));
				if (i > 0)
					streamArr[i].yTop.push(sizeScale.getValue(g_fun[i - 1][j] + padding));
				else
					streamArr[i].yTop.push(sizeScale.getValue(g0[j] + padding));
				streamArr[i].x.push(timeAxe.textPosition[j].x);
			}
		}
		for (var i = 0; i < streamArr.length; i++) {
			var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			var str = "M";
			var bSplineX = calculator.bSpline(streamArr[i].x);
			var bSplineYTop = calculator.bSpline(streamArr[i].yTop);
			var bSplineYEnd = calculator.bSpline(streamArr[i].yEnd);
			for (var j = 0; j < bSplineX.length; j++) {
				if (j > 0)
					str += "L";
				str += bSplineX[j] + " " + bSplineYTop[j];
			}
			for (var j = bSplineX.length - 1; j >= 0; j--) {
				str += "L" + bSplineX[j] + " " + bSplineYEnd[j];
			}
			str += "L" + bSplineX[0] + " " + bSplineYTop[0] + "Z";
			path.setAttribute('d', str);
			path.setAttribute('fill', color());
			path.setAttribute('stroke', 'none');
			graph.appendChild(path);
		}
	});
}())