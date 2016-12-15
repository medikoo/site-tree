'use strict';

var aFrom        = require('es5-ext/array/from')
  , d            = require('d')
  , isStyleSheet = require('html-dom-ext/link/is-style-sheet')

  , forEach = Array.prototype.forEach, defineProperty = Object.defineProperty;

module.exports = exports = function (nodes, parent) {
	var styleSheetsData, result;
	if (!exports.enabled) return aFrom(nodes);
	styleSheetsData = [];
	result = [];
	forEach.call(nodes, function self(node) {
		var sibling;
		if (isStyleSheet(node)) {
			if (node.hasAttribute('href')) {
				sibling = node.nextSibling;
				if (!sibling) {
					sibling = parent.appendChild(node.ownerDocument.createTextNode(''));
					result.push(defineProperty(sibling, '$siteTreeTemporary', d(true)));
				}
				styleSheetsData.push({ styleSheet: node, nextSibling: sibling });
				return;
			}
		}
		result.push(node);
	});
	if (!styleSheetsData.length) return result;
	setTimeout(function () {
		styleSheetsData.forEach(function (data) {
			if (data.nextSibling.parentNode) {
				data.nextSibling.parentNode.insertBefore(data.styleSheet, data.nextSibling);
				if (data.nextSibling.$siteTreeTemporary) {
					data.nextSibling.parentNode.removeChild(data.nextSibling);
				}
			} else if (data.styleSheet.parentNode) {
				data.styleSheet.parentNode.removeChild(data.styleSheet);
			}
		});
	}, 100);
	return result;
};

exports.enabled = true;
