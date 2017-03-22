// View tree

'use strict';

var find               = require('es5-ext/array/#/find')
  , includes           = require('es5-ext/array/#/contains')
  , assign             = require('es5-ext/object/assign')
  , forEach            = require('es5-ext/object/for-each')
  , ensureCallable     = require('es5-ext/object/valid-callable')
  , ensureObject       = require('es5-ext/object/valid-object')
  , ensureValue        = require('es5-ext/object/valid-value')
  , partial            = require('es5-ext/function/#/partial')
  , d                  = require('d')
  , ee                 = require('event-emitter')
  , memoizeMethods     = require('memoizee/methods-plain')
  , getNormalizer      = partial.call(require('memoizee/normalizers/get-fixed'), 2)
  , ensureIdent        = require('dom-ext/element/ensure-ident')
  , ensureDocument     = require('dom-ext/html-document/valid-html-document')
  , reflow             = require('dom-ext/html-document/#/reflow')
  , resetForms         = require('html-dom-ext/element/#/reset-forms')
  , fixStyleSheets     = require('./lib/fix-dynamic-style-sheets')
  , SiteNode           = require('./lib/node')
  , resolveRootElement = require('./lib/resolve-root-element')
  , resetDocument      = require('./lib/reset-document')

  , rootNames = { head: true, html: true, title: true, body: true, main: true }

  , stringify = JSON.stringify;

var SiteTree = module.exports = Object.defineProperties(function (document) {
	if (!(this instanceof SiteTree)) return new SiteTree(document);
	this.document = ensureDocument(document);
}, {
	// View validation function
	ensureView: d(function (conf) {
		forEach(ensureObject(conf), function (value, key) {
			var isConf;
			if (key[0] === '_') {
				if (key === '_dynamic') ensureCallable(value);
				return;
			}
			ensureIdent(key);
			ensureValue(value);
			if (key === 'html') {
				ensureObject(value);
				if ((value.class != null) || (value.content != null) || (value.prepend != null) ||
						(value.append != null)) {
					throw new TypeError("Configuration for <html> element should contain only " +
						"attributes settings");
				}
			}
			if (value.class != null) {
				ensureObject(value.class);
				isConf = true;
			}
			if (value.attributes != null) {
				ensureObject(value.attributes);
				isConf = true;
			}
			if (value.content != null) {
				this.ensureTemplate(value.content);
				if (value.prepend != null) {
					throw new TypeError("'prepend' configuration should not be used together with 'content'");
				}
				if (value.append != null) {
					throw new TypeError("'append' configuration should not be used together with 'content'");
				}
				return;
			}
			if (value.prepend != null) {
				this.ensureTemplate(value.prepend);
				isConf = true;
			}
			if (value.append != null) {
				this.ensureTemplate(value.append);
				isConf = true;
			}
			if (!isConf) this.ensureTemplate(value);
		}, this);
		return conf;
	}),

	// Template validation function
	// (this method may be overriden on subclasses for custom needs)
	ensureTemplate: d(ensureCallable)
});

ee(Object.defineProperties(SiteTree.prototype, assign({
	// Currently loaded view node
	current: d(null),

	// Wether in process of loading view
	_inLoad: d(false),

	// Resolves view configuration into DOM map
	// It's done once, and on demand, so right before we want to present given view in a window
	// for a first time
	_resolveView: d(function (conf, context) {
		var map = [];
		forEach(conf, function self(setup, id) {
			var conf, isConf;
			if (id[0] === '_') {
				if (id !== '_dynamic') return;
				forEach(setup.call(context), self, this);
				return;
			}
			map.push(conf = {});
			if (rootNames[id]) conf.element = resolveRootElement(this.document, id);
			if (!conf.element) conf.element = this.document.getElementById(id);
			if (!conf.element) throw new TypeError("Could not find element of id " + stringify(id));
			if (setup.class) {
				conf.class = setup.class;
				isConf = true;
			}
			if (setup.attributes) {
				conf.attributes = setup.attributes;
				isConf = true;
			}
			if (setup.content != null) {
				conf.content = this._resolveTemplate(setup.content, context);
				return;
			}
			if (setup.prepend != null) {
				conf.prepend = this._resolveTemplate(setup.prepend, context);
				isConf = true;
			}
			if (setup.append != null) {
				conf.append = this._resolveTemplate(setup.append, context);
				isConf = true;
			}
			if (isConf) return;
			conf.content = this._resolveTemplate(setup, context);
		}, this);
		return map;
	}),

	// Resolves template into DOM (document fragment)
	// (this method may be overriden on subclasses for custom needs)
	_resolveTemplate: d(function (tpl, context) { return tpl.call(context); }),

	// Loads provided raw view, so it's current
	load: d(function (conf, context) {
		var node, current, common, time = Date.now();

		// Prevent eventual recursive loads
		if (this._inLoad) {
			throw new Error("Unexpected operation: During load of view, received request to load " +
				"other view. Such operations (recursive view loads) are not supported");
		}
		this._inLoad = true;
		context = Object(context);

		// Resolve DOM for view node
		node = this._resolve(conf, context);
		current = this.current;

		// No action if node is already a current view node
		if (current === node) {
			this._inLoad = false;
			return;
		}

		// We need to unload all view nodes until common ancestor
		if (current) {
			common = find.call(current.ancestors, function (ancestor) {
				return includes.call(this, ancestor);
			}, node.ancestors);
			while (current !== common) {
				current._unload();
				current = current.parent;
			}
		} else {
			// If no common ancestor we just clear the document and load on carte blanche
			current = this;
			resetDocument(this.document);
		}

		// Load all ancestor view nodes
		node.ancestors.slice(0, node.ancestors.indexOf(current)).reverse().forEach(function (ancestor) {
			ancestor._load();
		});
		// Load view node in question
		node._load();
		this.current = node;

		// Assure repaint after content change
		reflow.call(this.document);
		console.log("View render in", ((Date.now() - time) / 1000).toFixed(2) + "s");
		this._inLoad = false;
		this.emit('load', node);
	}),

	// After elements are exposed in a view. Proceed with reset operations
	// (this method may be overriden for custom needs)
	_resetElement: d(function (element) {
		if (element.nodeType !== 1) return;
		resetForms.call(element);
		fixStyleSheets(element);
	}),

	// Resolves (generates DOM but do not load) tree node
	_resolve: d(function (conf, context) {
		var parent, match;
		conf = this.constructor.ensureView(conf);
		match = conf._match;
		if (conf._parent) {
			parent = this._resolve(conf._parent, context);
			if (!match) match = parent.match;
		} else {
			parent = this;
		}
		return this._resolveUnique(conf, match ? context[match] : undefined, context, parent);
	})
}, memoizeMethods({
	// Resolves tree node once (for given template/match combination should be invoked only once)
	_resolveUnique: d(function (conf, match, context, parent) {
		return new SiteNode(conf, context, parent);
	}, { getNormalizer: getNormalizer })
}))));
