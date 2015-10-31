'use strict';

var aFrom        = require('es5-ext/array/from')
  , isStyleSheet = require('html-dom-ext/link/is-style-sheet')

  , forEach = Array.prototype.forEach;

module.exports = exports = function (nodes, parent) {
	var styleSheetsData, result;
	if (!exports.enabled) return aFrom(nodes);
	styleSheetsData = [];
	result = [];
	forEach.call(nodes, function self(node) {
		if (isStyleSheet(node)) {
			if (node.hasAttribute('href')) {
				styleSheetsData.push({ styleSheet: node, nextSibling: node.nextSibling });
				return;
			}
		}
		result.push(node);
	});
	if (!styleSheetsData.length) return result;
	setTimeout(function () {
		styleSheetsData.forEach(function (data) {
			if (data.nextSibling && data.nextSibling.parentNode) {
				data.nextSibling.parentNode.insertBefore(data.styleSheet, data.nextSibling);
			} else if (parent) {
				parent.appendChild(data.styleSheet);
			}
		});
	}, 100);
	return result;
};

exports.enabled = true;
