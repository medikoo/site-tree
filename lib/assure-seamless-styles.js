'use strict';

var isParentNode = require('dom-ext/parent-node/is')
  , isStyleSheet = require('html-dom-ext/link/is-style-sheet')

  , forEach = Array.prototype.forEach;

module.exports = exports = function (nodes) {
	var styleSheets = [], container, document;
	if (!exports.enabled) return;
	forEach.call(nodes, function self(node) {
		if (isStyleSheet(node)) {
			if (node.hasAttribute('href')) styleSheets.push(node);
			return;
		}
		if (!isParentNode(node)) return;
		if (node.getElementsByTagName) {
			forEach.call(node.getElementsByTagName('link'), function (link) {
				if (!isStyleSheet(link)) return;
				if (link.hasAttribute('href')) styleSheets.push(node);
			});
			return;
		}
		forEach.call(node.childNodes, self);
	});

	if (!styleSheets.length) return;
	document = styleSheets[0].ownerDocument;
	container = document.documentElement.insertBefore(document.createElement('div'),
		document.documentElement.firstChild);
	container.className = 'ie-stylesheets-unload-workaround';
	styleSheets.forEach(function (styleSheet) {
		styleSheet = styleSheet.cloneNode(true);
		container.appendChild(styleSheet);
		styleSheet.setAttribute('href', styleSheet.getAttribute('href'));
	});
	setTimeout(function () { document.documentElement.removeChild(container); }, 0);
};

exports.enabled = true;
