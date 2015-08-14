var operator = {};
operator.constructSegements = function(data, timeSeq, index2Cluster, cluster2Index) {
	var allSegements = [];
	for (var index = 0; index < data.length; index++) {
		for (var timeIndex = 0; timeIndex < timeSeq.length - 1; timeIndex++) {
			for (var nextId in data[index][timeSeq[timeIndex]]['output']) {
				var node1 = new Node();
				var node2 = new Node();
				var segement = new Segement();
				var pOut = parseFloat(data[index][timeSeq[timeIndex]]['output'][nextId]) / parseFloat(data[index][timeSeq[timeIndex]]['size']);
				var pIn = parseFloat(data[index][timeSeq[timeIndex]]['output'][nextId]) /  parseFloat(data[cluster2Index[nextId]][timeSeq[timeIndex + 1]]['size']);
				node1.clusterId = index2Cluster[index];
				node2.clusterId = nextId;
				node1.x = timeIndex;
				node2.x = timeIndex + 1;
				node1.yOutputTop = data[index][timeSeq[timeIndex]].pOut;
				node1.yOutputEnd = data[index][timeSeq[timeIndex]].pOut + pOut;
				data[index][timeSeq[timeIndex]].pOut = node1.yOutputEnd;
				node2.yInputTop = data[cluster2Index[nextId]][timeSeq[timeIndex + 1]].pIn;
				node1.size = parseFloat(data[index][timeSeq[timeIndex]]['output'][nextId]);
				if (data[cluster2Index[nextId]][timeSeq[timeIndex + 1]]['input'].hasOwnProperty(index2Cluster[index])) {
					node2.yInputEnd = data[cluster2Index[nextId]][timeSeq[timeIndex + 1]].pIn + pIn;
					node2.size = parseFloat(data[index][timeSeq[timeIndex]]['output'][nextId]);
				} else {
					node2.yInputEnd = node2.yInputTop;
					node2.size = 0;
				}
				data[cluster2Index[nextId]][timeSeq[timeIndex + 1]].pIn = node2.yInputEnd;
				segement.node1 = node1;
				segement.node2 = node2;
				allSegements.push(segement);
			}
		}
	}
	return allSegements;
};

operator.sum4Each = function(arr) {
	var g = [];
	for (var i = 0; i < arr.length; i++) {
		for (var j = 0; j < arr[i].length; j++) {
			if (i === 0) {
				g.push(arr[i][j]);
			} else {
				g[j] += arr[i][j];
			}
		}
	}
	return g;
};

operator.bSpline = function(q, k) {
	var N = function(i, k, id, t) {
		if (k === 1) {
			if (id <= t[i + 1] && id >= t[i]) {
				return 1;
			} else {
				return 0;
			}
		} else {
			var a = (id - t[i]) * N(i, k - 1, id, t);
			var b = (t[i + k - 1] - t[i]);
			var c = (t[i + k] - id) * N(i + 1, k - 1, id, t);
			var d = (t[i + k] - t[i + 1]);
			if (b === 0) {
				b = 1;
			}
			if (d === 0) {
				d = 1;
			}
			return (a / b) + (c / d);
		}
	};
	var genT = function(k, n) {
		var t = [];
		for (var i = 0; i <= n + k; i++) {
			if (i < k) {
				t.push(0);
			} else if (i >= k && i <= n) {
				t.push(i - k + 1);
			} else {
				t.push(n - k + 2);
			}
		}
		var len = t[t.length - 1] - t[0];
		if (len != 0) {
			for (var i = 0; i < t.length; i++) {
				t[i] /= len;
			}
		}
		return t;
	};
	var spline = function(q, id, k) {
		var n = q.length - 1;
		var t = genT(k, n);
		var r = 0;
		for (var i = 0; i <= n; i++) {
			//console.log(N(i,k,id,t));
			r += (q[i] * N(i, k, id, t));
		}
		//console.log("----------");
		return r;
	};
	var list = [];
	for (var i = 0; i < 1; i += 0.01) {
		var value = spline(q, i, 4);
		list.push(value);
	}
	value = spline(q, 1, k);
	list.push(value);
	return list;
};