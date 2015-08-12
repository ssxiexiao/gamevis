var color = function() {
	var r = Math.round(Math.random() * 150 + 100);
	var g = Math.round(Math.random() * 150 + 100);
	var b = Math.round(Math.random() * 150 + 100);
	return "rgb(" + r + "," + g + "," + b + ")";
};
var shuffle = function(o) {
	for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};


var clickLastTime = '';

(function() {
	var width = 1600,
		height = 1200;
	var rectWidth = 20;
	var axePosition = {
		x1: 0,
		y1: 30,
		x2: 1000,
		y2: 30
	};
	var data = [];
	var cluster2Index = {};
	var index2Cluster = {};
	var globalClusterSize = 0;
	var colorSpace = {};
	var timeAxe = new Axe();
	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	var graph = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	var timeSeq = [];
	var allSegements = [];
	var rectData = [];
	var scale = new Scale();
	var padding = 10;
	var count = [];
	var size = [];
	var maxStreamSize = 0;
	var attr_max = {};
	var attr_min = {};
	var coordinate_xScale = new Scale();
	var coordinate_yScales = {};
	var coordinateAxis = {};
	var attr_size = 0;
	var attr2Index = {};

	timeAxe.setPosition(axePosition.x1, axePosition.y1, axePosition.x2, axePosition.y2);
	svg.setAttribute('width', width);
	svg.setAttribute('height', height);
	graph.appendChild(timeAxe.g);
	svg.appendChild(graph);
	document.getElementsByTagName('body')[0].appendChild(svg);
	d3.select('svg').append('g')
		.classed('coordinate', true);

	d3.json("data/labels.json", function(labels) {
		
		console.log(labels);
		for(var timestamp in labels){
			for(var cluster in labels[timestamp]){
				for(var i = 0; i < labels[timestamp][cluster].length; i++){
					for(var _attr in labels[timestamp][cluster][i]){
						if(!attr_max.hasOwnProperty(_attr)){
							attr_max[_attr] = parseFloat(labels[timestamp][cluster][i][_attr]);
							attr_min[_attr] = parseFloat(labels[timestamp][cluster][i][_attr]);
							attr_size++;
						}
						attr_max[_attr] = Math.max(attr_max[_attr], parseFloat(labels[timestamp][cluster][i][_attr]));
						attr_min[_attr] = Math.min(attr_min[_attr], parseFloat(labels[timestamp][cluster][i][_attr]));
					}
				}
			}
		}

		coordinate_xScale.setRange({min:axePosition.x2 + 30, max:width - 10})
			.setDomain({min:0, max:1});

		var num = 0.0;
		for(var i in attr_max){
			attr2Index[i] = num;
			if(attr_max[i] - attr_min[i] > 100000){
				var yscale = d3.scale.log()
					.range([0, 500])
					.domain([attr_max[i], 1]);
			}
			else{
				var yscale = d3.scale.linear()
					.range([0, 500])
					.domain([attr_max[i], attr_min[i]]);				
			}
			coordinate_yScales[i] = yscale;
			var axis = d3.svg.axis()
				.scale(yscale)
				.orient('right');
			coordinateAxis[i] = axis;
			coordinateAxis[i] = d3.select('.coordinate').append('g')
				.classed('axis', true)
				.attr('transform', 'translate('+coordinate_xScale.getValue(num/attr_size) + ',' + axePosition.y1 + ')')
				.call(axis)
				.append('text')
				.text(i)
				.attr('x', 0)
				.attr('y', -10);
			num++;
		}

		d3.json("data/data.json", function(json) {
			for (var clusterId in json) {
				for (var timestamp in json[clusterId]) {
					json[clusterId][timestamp]['pIn'] = 0;
					json[clusterId][timestamp]['pOut'] = 0;
				}
			}
			for (var clusterId in json) {
				for (var timestamp in json[clusterId]) {
					timeSeq.push(timestamp);
				}
				break;
			}
			timeSeq.sort();
			console.log(timeSeq);
			timeAxe.setText(timeSeq);

			for (var clusterId in json) {
				if (!cluster2Index.hasOwnProperty(clusterId)) {
					cluster2Index[clusterId] = globalClusterSize;
					index2Cluster[globalClusterSize] = clusterId;
					globalClusterSize++;
					data.push(json[clusterId]);
				}
			}
			console.log(globalClusterSize);

			for (var index = 0; index < data.length; index++) {
				for (var timeIndex = 0; timeIndex < timeSeq.length - 1; timeIndex++) {
					for (var nextId in data[index][timeSeq[timeIndex]]['output']) {
						var node1 = new Node();
						var node2 = new Node();
						var segement = new Segement();
						node1.clusterId = index2Cluster[index];
						node2.clusterId = nextId;
						node1.x = timeIndex;
						node2.x = timeIndex + 1;
						node1.yOutputTop = data[index][timeSeq[timeIndex]].pOut;
						node1.yOutputEnd = data[index][timeSeq[timeIndex]].pOut + parseFloat(data[index][timeSeq[timeIndex]]['output'][nextId]);
						data[index][timeSeq[timeIndex]].pOut = node1.yOutputEnd;
						node2.yInputTop = data[cluster2Index[nextId]][timeSeq[timeIndex + 1]].pIn;
						node1.size = parseFloat(data[index][timeSeq[timeIndex]]['size']) * parseFloat(data[index][timeSeq[timeIndex]]['output'][nextId]);
						if (data[cluster2Index[nextId]][timeSeq[timeIndex + 1]]['input'].hasOwnProperty(index2Cluster[index])) {
							node2.yInputEnd = data[cluster2Index[nextId]][timeSeq[timeIndex + 1]].pIn + parseFloat(data[cluster2Index[nextId]][timeSeq[timeIndex + 1]]['input'][index2Cluster[index]]);
							node2.size = parseFloat(data[cluster2Index[nextId]][timeSeq[timeIndex + 1]]['size']) * parseFloat(data[cluster2Index[nextId]][timeSeq[timeIndex + 1]]['input'][index2Cluster[index]]);
						} else {
							node2.yInputEnd = node2.yInputTop;
							node2.size = 0;
						}
						maxStreamSize = Math.max(maxStreamSize, node2.size);
						data[cluster2Index[nextId]][timeSeq[timeIndex + 1]].pIn = node2.yInputEnd;
						segement.node1 = node1;
						segement.node2 = node2;
						allSegements.push(segement);
					}
				}
			}
			console.log(allSegements);
			console.log(data);

			for (var i = 0; i < timeSeq.length; i++)
				size.push(0);
			for (var index = 0; index < data.length; index++) {
				colorSpace[index2Cluster[index]] = color();
				for (var i = 0; i < timeSeq.length; i++) {
					size[i] += parseFloat(data[index][timeSeq[i]].size);
				}
			}
			scale.setRange({
					min: axePosition.y1 + 10,
					max: axePosition.y1 + 750
				})
				.setDomain({
					min: 0,
					max: d3.max(size)
				});

			for (var i = 0; i < timeSeq.length; i++) {
				size[i] = 0;
				count.push(0);
			}

			for (var index = 0; index < data.length; index++) {
				for (var i = 0; i < timeSeq.length; i++) {
					data[index][timeSeq[i]].yTop = scale.getValue(size[i]) + count[i] * padding;
					size[i] += parseFloat(data[index][timeSeq[i]].size);
					data[index][timeSeq[i]].yEnd = scale.getValue(size[i]) + count[i] * padding;
					data[index][timeSeq[i]].x = timeAxe.textPosition[i].x;
					if (data[index][timeSeq[i]].yTop !== data[index][timeSeq[i]].yEnd) {
						count[i]++;
					}
				}
			}

			for (var index = 0; index < data.length; index++) {
				for (var i = 0; i < timeSeq.length; i++) {
					var obj = {};
					obj.cluster = index2Cluster[index];
					obj.x = data[index][timeSeq[i]].x - rectWidth / 2;
					obj.y = data[index][timeSeq[i]].yTop;
					obj.width = rectWidth;
					obj.height = data[index][timeSeq[i]].yEnd - data[index][timeSeq[i]].yTop;
					obj.fill = colorSpace[index2Cluster[index]];
					obj.textCotent = index2Cluster[index];
					obj.textX = data[index][timeSeq[i]].x + rectWidth;
					obj.textY = (data[index][timeSeq[i]].yEnd + data[index][timeSeq[i]].yTop) / 2;
					obj.visible = (data[index][timeSeq[i]].yTop !== data[index][timeSeq[i]].yEnd);
					if(labels[timeSeq[i]].hasOwnProperty(index2Cluster[index]))
						obj.labels = labels[timeSeq[i]][index2Cluster[index]]
					else
						obj.labels = null;
					rectData.push(obj);
				}
			}

			d3.select('svg').select('g')
				.append('g')
				.classed('rect', true);

			d3.select('.rect')
				.selectAll('rect')
				.data(rectData)
				.enter()
				.append('rect')
				.attr('x', function(d) {
					return d.x;
				})
				.attr('y', function(d) {
					return d.y;
				})
				.attr('width', function(d) {
					return d.width;
				})
				.attr('height', function(d) {
					return d.height;
				})
				.attr('fill', function(d) {
					return d.fill;
				});

			d3.select('.rect')
				.selectAll('text')
				.data(rectData)
				.enter()
				.append('text')
				.text(function(d) {
					return d.textCotent;
				})
				.attr('x', function(d) {
					return d.textX;
				})
				.attr('y', function(d) {
					return d.textY;
				})
				.attr('font-family', 'Arial')
				.attr('font-size', '10px')
				.style('visibility', function(d) {
					if (d.visible)
						return 'visible';
					return 'hidden';
				});

			d3.select('svg')
				.select('g')
				.selectAll('path')
				.data(allSegements)
				.enter()
				.append('path')
				.attr('d', function(segement) {
					var scale1 = new Scale();
					var scale2 = new Scale();
					var node1 = segement.node1;
					var node2 = segement.node2;
					scale1.setRange({
							min: data[cluster2Index[node1.clusterId]][timeSeq[node1.x]].yTop,
							max: data[cluster2Index[node1.clusterId]][timeSeq[node1.x]].yEnd
						})
						.setDomain({
							min: 0,
							max: 1
						});
					scale2.setRange({
							min: data[cluster2Index[node2.clusterId]][timeSeq[node2.x]].yTop,
							max: data[cluster2Index[node2.clusterId]][timeSeq[node2.x]].yEnd
						})
						.setDomain({
							min: 0,
							max: 1
						});
					var x1 = data[cluster2Index[node1.clusterId]][timeSeq[node1.x]].x + rectWidth / 2,
						y1 = scale1.getValue(node1.yOutputTop),
						x2 = data[cluster2Index[node2.clusterId]][timeSeq[node2.x]].x - rectWidth / 2,
						y2 = scale2.getValue(node2.yInputTop),
						x3 = x1,
						y3 = scale1.getValue(node1.yOutputEnd),
						x4 = x2,
						y4 = scale2.getValue(node2.yInputEnd),
						bx1 = (x1 + x2) / 2,
						by1 = y2,
						bx2 = bx1,
						by2 = y4;
					var d = 'M' + x1 + ' ' + y1 + 'Q' + bx1 + ' ' + by1 + ' ' + x2 + ' ' + y2 + 'L' + x4 + ' ' + y4 + 'Q' + bx2 + ' ' + by2 + ' ' + x3 + ' ' + y3 + 'L' + x1 + ' ' + y1;
					return d;
				})
				.attr('fill', function(segement) {
					var node1 = segement.node1;
					return colorSpace[node1.clusterId];
				})
				.attr('fill-opacity', 0.4)
				.classed('segement', true);

			d3.select('svg').select('g')
				.selectAll('rect')
				.on('click', function(obj) {

					d3.select('svg').select('g')
						.selectAll('path')
						.transition()
						.duration(1000)
						.attr('fill-opacity', function(segement) {
							var size = getValue() * maxStreamSize;
							var node1 = segement.node1;
							var node2 = segement.node2;
							if (node2.size < size)
								return 0;
							if (clickLastTime === obj.cluster)
								return 0.4;
							if (node1.clusterId === obj.cluster) {
								return 0.65;
							} else if (node2.clusterId === obj.cluster) {
								return 0.65;
							} else {
								return 0.1;
							}
						});
					if (clickLastTime != obj.cluster)
						clickLastTime = obj.cluster;
					else
						clickLastTime = '';


					d3.select('.coordinate')
						.selectAll('.user')
						.remove();

					for(var i = 0; i < Math.min(3000, obj.labels.length); i++){
						var d = 'M';
						var _num = 0;
						for(var j in obj.labels[i]){
							var x = coordinate_xScale.getValue(attr2Index[j]/attr_size);
							var y = coordinate_yScales[j](parseFloat(obj.labels[i][j])) + axePosition.y1;
							if(isNaN(coordinate_yScales[j](parseFloat(obj.labels[i][j]))))
								y = axePosition.y1 + coordinate_yScales[j](1);
							if(_num != 0)
								d += 'L';
							d += x + ' ' + y;
							_num++;
						}
						d3.select('.coordinate')
							.append('path')
							.attr('d', d)
							.attr('fill', 'none')
							.attr('stroke-width', '1px')
							.attr('stroke', obj.fill)
							.attr('stroke-opacity', 0.2)
							.classed('user', true);
					}
				});

			var onChange = function() {
				var size = getValue() * maxStreamSize;
				d3.select('svg')
					.select('g')
					.selectAll('path')
					.attr('fill-opacity', function(segement) {
						var node1 = segement.node1;
						var node2 = segement.node2;
						if (node2.size < size) {
							return 0;
						} else if (clickLastTime !== '' && (node1.clusterId === clickLastTime || node2.clusterId === clickLastTime)) {
							return 0.65;
						} else if (clickLastTime === '') {
							return 0.4;
						} else {
							return 0;
						}
					});
			};
			document.getElementsByTagName('input')[0].onchange = onChange;
		});
	});
}())

function getValue() {
	var value = document.getElementsByTagName('input')[0].value;
	value /= 100.0;
	value *= 0.3;
	return value;
}