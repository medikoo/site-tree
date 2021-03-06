'use strict';

var toArray  = require('es5-ext/array/to-array')
  , Domjs    = require('domjs')
  , SiteTree = require('../../');

module.exports = function (t, a) {
	var tree = new SiteTree(document), domjs = new Domjs(document), ns = domjs.ns
	  , header, content, foo, bar, par, other, newcontent, context = {}
	  , partialContent = {}, input, form;

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
		df.appendChild(form = ns.form(ns.div(input = ns.input({ type: "text", value: "miszka" }))));
		partialContent = df.appendChild(ns.div({ id: 'partial-content' }, ' melon '));
		return df;
	} };

	var page1 = { _name: 'page1', _parent: rootPage, foo: function () {
		var df = document.createDocumentFragment();
		df.appendChild(ns.span('foo 1 '));
		df.appendChild(ns.span('foo 2'));
		return df;
	}, bar: { content: function () {
		var df = document.createDocumentFragment();
		df.appendChild(ns.span('bar 1 '));
		df.appendChild(ns.span('bar 2'));
		return df;
	} }, 'partial-content': {
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

	var loadEvents = [];
	var page2 = { _name: 'page2', _parent: rootPage, content: function () {
		loadEvents.push("page2:render");
		var df = document.createDocumentFragment();
		par = df.appendChild(ns.p('Whatever'));
		other = df.appendChild(ns.div({ id: 'other-content' },
			ns.div('page2 other 1 '),
			ns.div('page2 other 2')));
		this.on("load:before", function () { loadEvents.push("page2:load:before"); });
		this.on("load", function () { loadEvents.push("page2:load:after"); });
		this.on("unload:before", function () { loadEvents.push("page2:unload:before"); });
		this.on("unload", function () { loadEvents.push("page2:unload:after"); });
		return df;
	} };

	var page3 = { _name: 'page3', _parent: page2, 'other-content': function () {
		loadEvents.push("page3:render");
		var df = document.createDocumentFragment();
		df.appendChild(ns.div('other 1 '));
		df.appendChild(ns.p('other 2'));
		this.on("load:before", function () { loadEvents.push("page3:load:before"); });
		this.on("load", function () { loadEvents.push("page3:load:after"); });
		this.on("unload:before", function () { loadEvents.push("page3:unload:before"); });
		this.on("unload", function () { loadEvents.push("page3:unload:after"); });
		return df;
	} };

	var newpage = { _name: 'newpage', _parent: rootPage, body: function () {
		var df = document.createDocumentFragment();
		newcontent = df.appendChild(ns.div());
		return df;
	} };

	tree.load(page1, context);
	a(foo.textContent, 'foo 1 foo 2', "Replace content #1");
	a(bar.textContent, 'bar 1 bar 2', "Replace content #2");
	a(partialContent.className, 'active', "Classname");
	a(partialContent.textContent, 'prepended 1 prepended 2 melon appended 1 appended 2',
		"Append/Prepend");

	a.deep(loadEvents, []);
	a(input.value, "miszka");
	input.value = "elo";
	a(input.value, "elo");
	tree.load(page3, context);
	a(input.value, "miszka");
	a.deep(loadEvents, ["page2:render", "page2:load:after", "page3:render", "page3:load:after"]);
	loadEvents.length = 0;

	a.deep(toArray(content.childNodes), [par, other],
		"Replace content (2 steps) #1");
	a(other.textContent, 'other 1 other 2', "Replace content (2 steps) #2");

	tree.load(page2, context);
	a.deep(loadEvents, ["page3:unload:before", "page3:unload:after", "page2:load:before",
		"page2:load:after"]);
	a(other.textContent, 'page2 other 1 page2 other 2', "Go back");

	tree.load(newpage, context);
	a.deep(toArray(document.body.childNodes), [newcontent], "Replace whole content");

	tree.load(rootPage, context);
	a.deep(toArray(document.body.childNodes), [header, content, form, partialContent],
		"Reload home #1");
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
