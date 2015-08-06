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
	var width = 1400,
		height = 1200;
	var axePosition = {
		x1: 0,
		y1: 100,
		x2: width,
		y2: 100
	};
	var timeAxe = new Axe();
	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	var graph = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	var timeSeq = [];
	var allSegements = [];
	var scale = new Scale();
	var padding = 5;
	timeAxe.setPosition(axePosition.x1, axePosition.y1, axePosition.x2, axePosition.y2);
	svg.setAttribute('width', width);
	svg.setAttribute('height', height);
	graph.appendChild(timeAxe.g);
	svg.appendChild(graph);
	document.getElementsByTagName('body')[0].appendChild(svg);
	d3.json("data/data.json", function(data) {
		for (var clusterId in data) {
			for (var timestamp in data[clusterId]) {
				data[clusterId][timestamp]['pIn'] = 0;
				data[clusterId][timestamp]['pOut'] = 0;
			}
		}
		for (var clusterId in data) {
			for (var timestamp in data[clusterId]) {
				timeSeq.push(timestamp);
			}
			break;
		}
		timeSeq.sort();
		console.log(timeSeq);
		timeAxe.setText(timeSeq);
		for (var clusterId in data) {
			for (var timeIndex = 0; timeIndex < timeSeq.length - 1; timeIndex++) {
				for (var nextId in data[clusterId][timeSeq[timeIndex]]['output']) {
					var node1 = new Node();
					var node2 = new Node();
					var segement = new Segement();
					node1.clusterId = clusterId;
					node2.clusterId = nextId;
					node1.x = timeIndex;
					node2.x = timeIndex + 1;
					node1.yOutputTop = data[clusterId][timeSeq[timeIndex]].pOut;
					node1.yOutputEnd = data[clusterId][timeSeq[timeIndex]].pOut + parseFloat(data[clusterId][timeSeq[timeIndex]]['output'][nextId]);
					data[clusterId][timeSeq[timeIndex]].pOut = node1.yOutputEnd;
					node2.yInputTop = data[nextId][timeSeq[timeIndex + 1]].pIn;
					if (data[nextId][timeSeq[timeIndex + 1]]['input'].hasOwnProperty(clusterId)) {
						node2.yInputEnd = data[nextId][timeSeq[timeIndex + 1]].pIn + parseFloat(data[nextId][timeSeq[timeIndex + 1]]['input'][clusterId]);
					} else {
						node2.yInputEnd = node2.yInputTop;
					}
					data[nextId][timeSeq[timeIndex + 1]].pIn = node2.yInputEnd;
					segement.node1 = node1;
					segement.node2 = node2;
					allSegements.push(segement);
				}
			}
		}
		console.log(data);
		console.log(allSegements);
		var size = [];
		for (var i = 0; i < timeSeq.length; i++)
			size.push(0);
		for (var clusterId in data) {
			data[clusterId].color = color();
			for (var i = 0; i < timeSeq.length; i++) {
				size[i] += parseFloat(data[clusterId][timeSeq[i]].size);
			}
		}
		scale.setRange({
				min: 120,
				max: 900
			})
			.setDomain({
				min: 0,
				max: d3.max(size)
			});
		console.log(d3.max(size));
		for (var i = 0; i < timeSeq.length; i++)
			size[i] = 0;
		var count = 0;
		for (var clusterId in data) {
			for (var i = 0; i < timeSeq.length; i++) {
				data[clusterId][timeSeq[i]].yTop = scale.getValue(size[i]) + count * padding;
				size[i] += parseFloat(data[clusterId][timeSeq[i]].size);
				data[clusterId][timeSeq[i]].yEnd = scale.getValue(size[i]) + count * padding;
				data[clusterId][timeSeq[i]].x = timeAxe.textPosition[i].x;
				var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				rect.setAttribute('x', data[clusterId][timeSeq[i]].x - 10);
				rect.setAttribute('y', data[clusterId][timeSeq[i]].yTop);
				rect.setAttribute('width', 20);
				rect.setAttribute('height', data[clusterId][timeSeq[i]].yEnd - data[clusterId][timeSeq[i]].yTop);
				rect.setAttribute('fill', data[clusterId].color);
				graph.appendChild(rect);
			}
			count++;
		}
		for (var i = 0; i < allSegements.length; i++) {
			var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			var scale1 = new Scale();
			var scale2 = new Scale();
			var node1 = allSegements[i].node1;
			var node2 = allSegements[i].node2;
			scale1.setRange({
					min: data[node1.clusterId][timeSeq[node1.x]].yTop,
					max: data[node1.clusterId][timeSeq[node1.x]].yEnd
				})
				.setDomain({
					min: 0,
					max: 1
				});
			scale2.setRange({
					min: data[node2.clusterId][timeSeq[node2.x]].yTop,
					max: data[node2.clusterId][timeSeq[node2.x]].yEnd
				})
				.setDomain({
					min: 0,
					max: 1
				});
			var x1 = data[node1.clusterId][timeSeq[node1.x]].x+10,
				y1 = scale1.getValue(node1.yOutputTop),
				x2 = data[node2.clusterId][timeSeq[node2.x]].x-10,
				y2 = scale2.getValue(node2.yInputTop),
				x3 = x1,
				y3 = scale1.getValue(node1.yOutputEnd),
				x4 = x2,
				y4 = scale2.getValue(node2.yInputEnd);
			if(node2.yInputTop < 0 || node2.yInputTop > 1)
				console.log(1);
			var d = 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + 'L' + x4 + ' ' + y4 + 'L' + x3 + ' ' + y3 + 'L' + x1 + ' ' + y1;
			path.setAttribute('d', d);
			path.setAttribute('fill', data[node1.clusterId].color);
			path.setAttribute('fill-opacity', 0.4);
			graph.appendChild(path);
		}
	});
}())