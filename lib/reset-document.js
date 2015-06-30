'use strict';

var forEachRight    = require('es5-ext/array/#/for-each-right')
  , clear           = require('dom-ext/element/#/clear')
  , clearAttributes = require('dom-ext/element/#/clear-attributes');

module.exports = function (document) {
	var head, body;
	if (!document.documentElement) return;
	clearAttributes.call(document.documentElement);
	head = document.getElementsByTagName('head')[0];
	if (head) {
		clearAttributes.call(head);
		forEachRight.call(head.childNodes, function (node) {
			if (node.nodeName.toLowerCase() === 'title') {
				clearAttributes.call(node);
				clear.call(node);
				return;
			}
			head.removeChild(node);
		});
	}
	body = document.getElementsByTagName('body')[0];
	if (!body) return;
	clearAttributes.call(body);
	clear.call(body);
};
