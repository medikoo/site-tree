'use strict';

var remove   = require('dom-ext/element/#/remove');

module.exports = function self(document, name) {
	var element = document.getElementsByTagName(name)[0], head;
	if (element) return element;
	if (name === 'main') return null;
	element = document.createElement(name);
	if (name === 'html') return document.appendChild(element);
	if (!document.documentElement) document.appendChild(document.createElement('html'));
	if (name === 'head') {
		return document.documentElement.insertBefore(element, document.documentElement.firstChild);
	}
	if (name === 'title') {
		head = self(document, 'head');
		return head.insertBefore(element, head.firstChild);
	}
	if (name === 'body') {
		setTimeout(function () {
			var bodies = document.getElementsByTagName(name);
			if (bodies.length === 2) remove.call(bodies[1]);
		}, 0);
	}
	return document.documentElement.appendChild(element);
};
