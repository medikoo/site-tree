'use strict';

var resolveRootElement = require('../../lib/resolve-root-element');

module.exports = function (t, a) {
	var html = resolveRootElement(document, 'html')
	  , head = resolveRootElement(document, 'head')
	  , title = resolveRootElement(document, 'title')
	  , body = resolveRootElement(document, 'body');

	html.setAttribute('foo', 'bar');
	head.setAttribute('foo', 'bar');
	title.innerHTML = 'ELo';
	title.setAttribute('foo', 'bar');
	head.appendChild(document.createElement('p'));
	body.setAttribute('foo', 'bar');
	body.appendChild(document.createElement('p'));

	t(document);
	a(html, resolveRootElement(document, 'html'));
	a(html.getAttribute('foo'), null);
	a(head, resolveRootElement(document, 'head'));
	a(head.getAttribute('foo'), null);
	a(head.childNodes.length, 1);
	a(title, resolveRootElement(document, 'title'));
	a(title.getAttribute('foo'), null);
	a(body, resolveRootElement(document, 'body'));
	a(body.getAttribute('foo'), null);
	a(body.childNodes.length, 0);
};
