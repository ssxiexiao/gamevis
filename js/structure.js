function Scale() {
	this._range = {
		min: 0,
		max: 0
	};
	this._domain = {
		min: 0,
		max: 0
	};
}
Scale.prototype.setRange = function(range) {
	this._range.min = parseFloat(range.min);
	this._range.max = parseFloat(range.max);
	return this;
};
Scale.prototype.setDomain = function(domain) {
	this._domain.min = parseFloat(domain.min);
	this._domain.max = parseFloat(domain.max);
	return this;
};
Scale.prototype.getPercentage = function(domainValue) {
	var percentage = (domainValue - this._domain.min) / (this._domain.max - this._domain.min);
	return percentage;
};
Scale.prototype.getValue = function(domainValue) {
	var percentage = this.getPercentage(domainValue);
	var value = percentage * (this._range.max - this._range.min) + this._range.min;
	return value;
};

function Axe() {
	this.xScale = null;
	this.yScale = null;
	this.text = [];
	this.textPosition = [];
	this.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	this.g.appendChild(this.line);
	console.log(this.g);
}
Axe.prototype.setPosition = function(x1, y1, x2, y2) {
	this.line.setAttribute('x1', x1);
	this.line.setAttribute('y1', y1);
	this.line.setAttribute('x2', x2);
	this.line.setAttribute('y2', y2);
	this.xScale = new Scale();
	this.yScale = new Scale();
	this.xScale.setRange({
			min: x1,
			max: x2
		})
		.setDomain({
			min: 0,
			max: 1
		});
	this.yScale.setRange({
			min: y1,
			max: y2
		})
		.setDomain({
			min: 0,
			max: 1
		});
	this.line.setAttribute('stroke', 'black');
	this.line.setAttribute('stroke-width', '2px');
	return this;
};
Axe.prototype.getPosition = function(p) {
	var x = this.xScale.getValue(p);
	var y = this.yScale.getValue(p);
	return {
		x: x,
		y: y
	};
};
Axe.prototype.setText = function(str) {
	var len = str.length;
	for (var i = 0; i < len; i++) {
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.innerHTML = str[i];
		text.setAttribute('text-anchor', 'middle');
		var position = this.getPosition((i + 1.0) / (len + 1.0));
		this.textPosition.push(position);
		text.setAttribute('x', position.x);
		text.setAttribute('y', position.y);
		text.setAttribute('font-size', 12);
		text.setAttribute('font-family', 'Arial');
		this.text.push(text);
		this.g.appendChild(text);
	}
};
Axe.prototype.clearText = function() {
	for (var i = 0; i < this.text.length; i++) {
		this.g.removeChild(this.text[i]);
	}
	this.text = [];
	this.textPosition = [];
};

function Stream() {
	this.yEnd = [];
	this.yTop = [];
	this.x = [];
}