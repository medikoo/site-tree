// View node

'use strict';

var aFrom                = require('es5-ext/array/from')
  , assign               = require('es5-ext/object/assign')
  , ensurePromise        = require('es5-ext/object/ensure-promise')
  , forEach              = require('es5-ext/object/for-each')
  , d                    = require('d')
  , lazy                 = require('d/lazy')
  , ee                   = require('event-emitter')
  , assureSeamlessStyles = require('./assure-seamless-styles')

  , push = Array.prototype.push, slice = Array.prototype.slice;

var appendChild = function (parent, child) {
	try {
		parent.appendChild(child);
	} catch (e) {
		if (e.message !== 'Invalid argument.') throw e;
		if (child.nodeType !== 3) throw e;
		// Workaround for IE bug
		// See description of related issue http://stackoverflow.com/q/23892053/96806
		parent.appendChild(child.ownerDocument.createTextNode(child.data));
	}
};

var getIsCurrent = function () { return this.isCurrent; };
var registerPromise = function (promise) {
	if (!this.isCurrent) {
		throw new Error("Cannot register promise for not currrent node view");
	}
	this.tree._promises.push(ensurePromise(promise));
};

var SiteNode = module.exports = function (conf, context, parent) {
	this.conf = conf;
	this.context = ee(Object.create(context, {
		isCurrent: d.gs(getIsCurrent.bind(this)),
		registerPromise: d(registerPromise.bind(this))
	}));
	this.match = conf._match || parent.match;
	this.parent = parent;
	this.tree = parent.tree || parent;
	this.ancestors = [parent];
	if (parent.ancestors) push.apply(this.ancestors, parent.ancestors);
};

Object.defineProperties(SiteNode.prototype, assign({
	parent: d(null),
	isCurrent: d.gs(function () {
		var node = this.tree.current;
		while (node) {
			if (node === this) return true;
			node = node.parent;
		}
		return false;
	}),

	// Switches between parent and this node view, or other way
	_switch: d(function (after) {
		var before = [], document = this.tree.document, inserted, toRemove, index;

		// Traverse all change instructions
		after.forEach(function (conf) {
			var reverseConf = { element: conf.element }, titleElement;
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

			if (conf.attributes) {
				// Update attributes
				reverseConf.attributes = {};
				forEach(conf.attributes, function (value, name) {
					reverseConf.attributes[name] = conf.element.getAttribute(name);
					if (value === true) conf.element.setAttribute(name, name);
					else if ((value != null) && (value !== false)) conf.element.setAttribute(name, value);
					else conf.element.removeAttribute(name);
				});
			}

			if (conf.content) {
				// Replace content
				reverseConf.content = document.createDocumentFragment();
				if (conf.element.nodeName.toLowerCase() === 'head') {
					titleElement = conf.element.getElementsByTagName('title')[0];
					if (titleElement) conf.element.removeChild(titleElement);
				}
				assureSeamlessStyles(conf.element.childNodes, reverseConf.content).forEach(function (el) {
					reverseConf.content.appendChild(el);
				});
				if (titleElement) conf.element.appendChild(titleElement);
				appendChild(conf.element, conf.content);
				this.tree._resetElement(conf.element);
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
					appendChild(conf.element, conf.append);
				}
				if (inserted) inserted.forEach(this.tree._resetElement, this.tree);

				if (conf.prependMark) {
					// Remove back prepended content
					reverseConf.prepend = document.createDocumentFragment();
					index = 0;
					while (conf.element.childNodes[index] !== conf.prependMark) ++index;
					toRemove = slice.call(conf.element.childNodes, 0, index);
					assureSeamlessStyles(toRemove);
					while (toRemove[0]) appendChild(reverseConf.prepend, toRemove.shift());
					conf.element.removeChild(conf.element.firstChild);
				}

				if (conf.appendMark) {
					// Remove back appended content
					reverseConf.append = document.createDocumentFragment();
					index = 0;
					while (conf.element.childNodes[index] !== conf.appendMark) ++index;
					toRemove = slice.call(conf.element.childNodes, index + 1);
					assureSeamlessStyles(toRemove);
					while (toRemove[0]) appendChild(reverseConf.append, toRemove.shift());
					conf.element.removeChild(conf.element.lastChild);
				}
			}
		}, this);
		return before;
	}),

	// Loads this node view (when parent is a current view)
	_load: d(function () {
		this.context.emit('load:before');
		this.domMapReverse = this._switch(this.domMap);
		this.context.emit('load');
	}),

	// Unloads this node view so parent view becomes current (when this node is a current view)
	_unload: d(function () {
		this.context.emit('unload:before');
		this.domMap = this._switch(this.domMapReverse);
		this.context.emit('unload');
	})
}, lazy({

	// Resolve all templates and map DOM elements in view map
	// (done once, on first access)
	domMap: d(function () {
		return this.tree._resolveView(this.conf, this.context);
	})
})));
