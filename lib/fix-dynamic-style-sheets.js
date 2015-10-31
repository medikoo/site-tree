// In IE stylesheets that are added via innerHTML are not applied
// fix is to reset their 'href' attributes after they're inserted into DOM
// We need to do it just in IE (that's why `link.sizes` check) as in other browsers
// it may produce flash of unstyled content

'use strict';

var isParentNode = require('dom-ext/parent-node/is')
  , isStyleSheet = require('html-dom-ext/link/is-style-sheet')

  , forEach = Array.prototype.forEach;

var fixLink = function (link) {
	if (!isStyleSheet(link)) return;
	if (!link.hasAttribute('href')) return;
	if (!link.sizes) link.setAttribute('href', link.getAttribute('href'));
};

module.exports = function self(node) {
	if (isStyleSheet(node)) {
		fixLink(node);
		return;
	}
	if (!isParentNode(node)) return;
	if (node.getElementsByTagName) {
		forEach.call(node.getElementsByTagName('link'), fixLink);
		return;
	}
	forEach.call(node.childNodes, self);
};
