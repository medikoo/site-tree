'use strict';

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
	return document.documentElement.appendChild(element);
};
