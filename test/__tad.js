'use strict';

var ClassList = require('class-list')
  , document;

try {
	document = require('jsdom').jsdom();
} catch (ignore) {}

if (document) {
	Object.defineProperty(document.defaultView.HTMLElement.prototype, 'classList', {
		get: function () {
			Object.defineProperty(this, 'classList',
				{ value: null, writable: true, configurable: true });
			Object.defineProperty(this, 'classList',
				{ value: new ClassList(this), writable: true, configurable: true });
			return this.classList;
		}
	});
}

exports.context = document ? {
	document: document,
	setTimeout: setTimeout
} : {};
