var calculator = {};
calculator.sum4Each = function(arr){
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
calculator.bSpline = function(q) {
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
	for (var i = 0; i <= 1; i += 0.01) {
		var value = spline(q, i, 4);
		list.push(value);
	}
	value = spline(q, 1, 3);
	list.push(value);
	return list;
};

calculator.setBaseLine = function(baseLine) {
	var min = d3.min(baseLine);
	if (min < 0) {
		for (var i = 0; i < baseLine.length; i++) {
			baseLine[i] -= min;
		}
	}
};