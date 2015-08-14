var color = function() {
	var r = Math.round(Math.random() * 150 + 100);
	var g = Math.round(Math.random() * 150 + 100);
	var b = Math.round(Math.random() * 150 + 100);
	return "rgb(" + r + "," + g + "," + b + ")";
};

function getValue() {
	var value = document.getElementsByTagName('input')[0].value;
	value /= 100.0;
	value *= 0.3;
	return value;
}

(function() {
	var width = 1800,
		height = 1200;
	var rectWidth = 20;
	var timeAxisPosition = {
		x1: 0,
		y1: 30,
		x2: 1200,
		y2: 30
	};
	var data = [];
	var cluster2Index = {};
	var index2Cluster = {};
	var globalClusterSize = 0;
	var colorSpace = {};
	var timeAxis = new Axis();
	var svg = null;
	var graph = null;
	var timeSeq = [];
	var allSegements = null;
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
	var clickLastTime = '';

	timeAxis.setPosition(timeAxisPosition.x1, timeAxisPosition.y1, timeAxisPosition.x2, timeAxisPosition.y2);
	svg = d3.select('body')
		.append('svg')
		.attr('width', width)
		.attr('height', height);
	graph = d3.select('svg')
		.append('g')
		.classed('graph', true);
	document.getElementsByTagName('g')[0].appendChild(timeAxis.g);

	d3.select('svg').append('g')
		.classed('coordinate', true);
	d3.select('.coordinate')
		.append('g')
		.classed('user', true);

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

		//set the Parallel Coordinates
		coordinate_xScale.setRange({min:timeAxisPosition.x2 + 30, max:width - 10})
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
				.attr('transform', 'translate('+coordinate_xScale.getValue(num/attr_size) + ',' + timeAxisPosition.y1 + ')')
				.call(axis)
				.append('text')
				.text(i)
				.attr('x', 0)
				.attr('y', -10);
			num++;
		}

		d3.json("data/data.json", function(json) {
			console.log(json);
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
			timeAxis.setText(timeSeq);

			for (var clusterId in json) {
				if (!cluster2Index.hasOwnProperty(clusterId)) {
					cluster2Index[clusterId] = globalClusterSize;
					index2Cluster[globalClusterSize] = clusterId;
					globalClusterSize++;
					data.push(json[clusterId]);
				}
			}

			allSegements = operator.constructSegements(data, timeSeq, index2Cluster, cluster2Index);

			for(var i = 0; i < allSegements.length; i++){
				var segement = allSegements[i];
				maxStreamSize = Math.max(maxStreamSize, segement.node2.size);
			}

			for (var i = 0; i < timeSeq.length; i++)
				size.push(0);
			for (var index = 0; index < data.length; index++) {
				colorSpace[index2Cluster[index]] = color();
				for (var i = 0; i < timeSeq.length; i++) {
					size[i] += parseFloat(data[index][timeSeq[i]].size);
				}
			}
			scale.setRange({
					min: timeAxisPosition.y1 + 10,
					max: timeAxisPosition.y1 + 750
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
					data[index][timeSeq[i]].x = timeAxis.textPosition[i].x;
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

			d3.select('.graph')
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

			d3.select('.graph')
				.append('g')
				.classed('path', true);
			d3.select('.path')
				.selectAll('path')
				.data(allSegements)
				.enter()
				.append('path')
				.attr('d', function(segement) {
					var node1 = segement.node1;
					var node2 = segement.node2;
					var scale1 = d3.scale.linear()
						.range([data[cluster2Index[node1.clusterId]][timeSeq[node1.x]].yTop, data[cluster2Index[node1.clusterId]][timeSeq[node1.x]].yEnd])
						.domain([0, 1]);
					var scale2 = d3.scale.linear()
						.range([data[cluster2Index[node2.clusterId]][timeSeq[node2.x]].yTop, data[cluster2Index[node2.clusterId]][timeSeq[node2.x]].yEnd])
						.domain([0, 1]);
					var x1 = data[cluster2Index[node1.clusterId]][timeSeq[node1.x]].x + rectWidth / 2,
						y1 = scale1(node1.yOutputTop),
						x2 = data[cluster2Index[node2.clusterId]][timeSeq[node2.x]].x - rectWidth / 2,
						y2 = scale2(node2.yInputTop),
						x3 = x1,
						y3 = scale1(node1.yOutputEnd),
						x4 = x2,
						y4 = scale2(node2.yInputEnd),
						bx1 = (x1 + x2) / 2,
						by1 = y1,
						bx2 = bx1,
						by2 = y2,
						bx3 = (x3 + x4) / 2,
						by3 = y3,
						bx4 = bx3,
						by4 = y4;
					var d = 'M' + x1 + ' ' + y1 + 'C' + bx1 + ' ' + by1 + ' ' + bx2 + ' ' + by2 + ' ' + x2 + ' ' + y2 
						+ 'L' + x4 + ' ' + y4 + 'C' + bx4 + ' ' + by4 + ' ' + bx3 + ' ' + by3 + ' ' + x3 + ' ' + y3 + 'L' + x1 + ' ' + y1;
					return d;
				})
				.attr('fill', function(segement) {
					var node1 = segement.node1;
					return colorSpace[node1.clusterId];
				})
				.attr('fill-opacity', 0.4)
				.classed('segement', true);

			d3.select('.rect')
				.selectAll('rect')
				.on('click', function(obj) {

					d3.select('.path')
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

					var userData = [];
					for(var i = 0; i < Math.min(2000, obj.labels.length); i++){
						userData.push(obj.labels[i]);
					}
					d3.select('.user')
						.selectAll('path')
						.data(userData)
						.enter()
						.append('path')						
						.attr('fill', 'none')
						.attr('stroke-width', '1px')
						.attr('stroke-opacity', 0.2)
					d3.select('.user')
						.selectAll('path')
						.data(userData)
						.exit()
						.remove();
					d3.select('.user')
						.selectAll('path')
						.transition()
						.duration(1000)
						.attr('stroke', obj.fill)
						.attr('d', function(data){
							var d = 'M';
							var _num = 0;
							for(var j in data){
								var x = coordinate_xScale.getValue(attr2Index[j]/attr_size);
								var y = coordinate_yScales[j](parseFloat(data[j])) + timeAxisPosition.y1;
								if(isNaN(coordinate_yScales[j](parseFloat(data[j]))))
									y = timeAxisPosition.y1 + coordinate_yScales[j](1);
								if(_num != 0)
									d += 'L';
								d += x + ' ' + y;
								_num++;
							}
							return d;							
						});	
				});

			var onChange = function() {
				var size = getValue() * maxStreamSize;
				d3.select('.path')
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
							return 0.1;
						}
					});
			};
			document.getElementsByTagName('input')[0].onchange = onChange;
		});
	});
}())
