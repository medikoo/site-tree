'use strict';

module.exports = function (document, name) {
	var element = document.getElementsByTagName(name)[0];
	if (element) return element;
	element = document.createElement(name);
	if (!document.documentElement) document.appendChild(document.createElement('html'));
	if (name === 'head') {
		return document.documentElement.insertBefore(element, document.documentElement.firstChild);
	}
	return document.documentElement.appendChild(element);
};
