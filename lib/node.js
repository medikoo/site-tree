// View node

'use strict';

var aFrom              = require('es5-ext/array/from')
  , assign             = require('es5-ext/object/assign')
  , forEach            = require('es5-ext/object/for-each')
  , d                  = require('d')
  , lazy               = require('d/lazy')
  , resolveRootElement = require('./resolve-root-element')

  , rootNames = { head: true, body: true }
  , push = Array.prototype.push, stringify = JSON.stringify;

var SiteNode = module.exports = function (conf, context, parent) {
	this.conf = conf;
	this.context = context;
	this.parent = parent;
	this.tree = parent.tree || parent;
	this.ancestors = [parent];
	if (parent.ancestors) push.apply(this.ancestors, parent.ancestors);
};

Object.defineProperties(SiteNode.prototype, assign({
	parent: d(null),

	// Switches between parent and this node view, or other way
	_switch: d(function (after) {
		var before = [], document = this.tree.document, inserted;
		after.forEach(function (conf) {
			var reverseConf = { element: conf.element };
			before.push(reverseConf);
			if (conf.class) {
				// Update classes
				reverseConf.class = {};
				forEach(conf.class, function (value, name) {
					reverseConf.class[name] = conf.element.classList.contains(name);
					if (value) conf.element.classList.add(name);
					else conf.element.classList.remove(name);
				});
			}
			if (conf.content) {
				// Replace content
				reverseConf.content = document.createDocumentFragment();
				while (conf.element.firstChild) reverseConf.content.appendChild(conf.element.firstChild);
				conf.element.appendChild(conf.content);
				this.tree.resetElement(conf.element);
			} else {
				if (conf.prepend) {
					// Prepend content
					inserted = aFrom(conf.prepend.childNodes);
					reverseConf.prependMark = conf.element.insertBefore(document.createTextNode(''),
						conf.element.firstChild);
					conf.element.insertBefore(conf.prepend, reverseConf.prependMark);
				}
				if (conf.append) {
					// Append content
					inserted = aFrom(conf.append.childNodes);
					reverseConf.appendMark = conf.element.appendChild(document.createTextNode(''));
					conf.element.appendChild(conf.append);
				}
				if (inserted) inserted.forEach(this.tree.resetElement, this.tree);
				if (conf.prependMark) {
					// Remove back prepended content
					reverseConf.prepend = document.createDocumentFragment();
					while (conf.element.firstChild !== conf.prependMark) {
						reverseConf.prepend.appendChild(conf.element.firstChild);
					}
					conf.element.removeChild(conf.element.firstChild);
				}
				if (conf.appendMark) {
					// Remove back appended content
					reverseConf.append = document.createDocumentFragment();
					while (conf.element.lastChild !== conf.appendMark) {
						reverseConf.append.insertBefore(conf.element.lastChild, reverseConf.append.firstChild);
					}
					conf.element.removeChild(conf.element.lastChild);
				}
			}
		}, this);
		return before;
	}),

	// Loads this node view (when parent is a current view)
	_load: d(function () { this.reverseMap = this._switch(this.map); }),

	// Unloads this node view so parent view becomes current (when this node is a current view)
	_unload: d(function () { this.map = this._switch(this.reverseMap); })
}, lazy({

	// Resolve all templates and map DOM elements in view map
	// (done once, on first access)
	map: d(function () {
		var map = [];
		forEach(this.conf, function (setup, id) {
			var conf;
			if (id[0] === '_') return;
			map.push(conf = {});
			if (rootNames[id]) conf.element = resolveRootElement(this.tree.document, id);
			else conf.element = this.tree.document.getElementById(id);
			if (!conf.element) throw new TypeError("Could not find element of id " + stringify(id));
			if (typeof setup === 'function') {
				conf.content = this.tree.resolveTemplate(setup, this.context);
				return;
			}
			if (setup.class) conf.class = setup.class;
			if (setup.content) conf.content = this.tree.resolveTemplate(setup.content, this.context);
			if (setup.prepend) conf.prepend = this.tree.resolveTemplate(setup.prepend, this.context);
			if (setup.append) conf.append = this.tree.resolveTemplate(setup.append, this.context);
		}, this);
		return map;
	})
})));
