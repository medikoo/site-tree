'use strict';

var toArray  = require('es5-ext/array/to-array')
  , Domjs    = require('domjs');

module.exports = function (T, a) {
	var tree = new T(document), domjs = new Domjs(document), ns = domjs.ns
	  , header, content, foo, bar, context = {}, partialContent = {};

	var rootPage = { _name: 'root', body: function () {
		var df = document.createDocumentFragment();
		header = df.appendChild(ns.div({ id: 'header' }, 'Header'));
		content = df.appendChild(ns.div({ id: 'content' },
			foo = ns.div({ id: 'foo' },
				ns.p('foo'),
				ns.p('bar')),
			ns.div(bar = ns.div({ id: 'bar' },
				ns.p('Other foo'),
				ns.p('Other bar')))));
		partialContent = df.appendChild(ns.div({ id: 'partial-content' }, ' melon '));
		return df;
	} };

	var page1 = { _name: 'page1', _parent: rootPage, foo: function () {
		var df = document.createDocumentFragment();
		df.appendChild(ns.span('foo 1 '));
		df.appendChild(ns.span('foo 2'));
		return df;
	}, bar: function () {
		var df = document.createDocumentFragment();
		df.appendChild(ns.span('bar 1 '));
		df.appendChild(ns.span('bar 2'));
		return df;
	}, 'partial-content': {
		class: { active: true },
		prepend: function () {
			var df = document.createDocumentFragment();
			df.appendChild(ns.span('prepended 1 '));
			df.appendChild(ns.span('prepended 2'));
			return df;
		},
		append: function () {
			var df = document.createDocumentFragment();
			df.appendChild(ns.span('appended 1 '));
			df.appendChild(ns.span('appended 2'));
			return df;
		}
	} };

	tree.load(page1, context);
	a(foo.textContent, 'foo 1 foo 2', "Replace content #1");
	a(bar.textContent, 'bar 1 bar 2', "Replace content #2");
	a(partialContent.className, 'active', "Classname");
	a(partialContent.textContent, 'prepended 1 prepended 2 melon appended 1 appended 2',
		"Append/Prepend");

	tree.load(rootPage, context);
	a.deep(toArray(document.body.childNodes), [header, content, partialContent], "Reload home #1");
	a.deep(toArray(content.childNodes), [foo, bar.parentNode], "Reload home #2");
	a(partialContent.className, '');
	a(partialContent.textContent, ' melon ', "Append/Prepend");

	tree.load(page1, context);
	a(foo.textContent, 'foo 1 foo 2', "Replace content #1");
	a(bar.textContent, 'bar 1 bar 2', "Replace content #2");
	a(partialContent.className, 'active', "Classname");
	a(partialContent.textContent, 'prepended 1 prepended 2 melon appended 1 appended 2',
		"Append/Prepend");
};
