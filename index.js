// View tree

'use strict';

var find               = require('es5-ext/array/#/find')
  , includes           = require('es5-ext/array/#/contains')
  , assign             = require('es5-ext/object/assign')
  , forEach            = require('es5-ext/object/for-each')
  , ensureCallable     = require('es5-ext/object/valid-callable')
  , ensureObject       = require('es5-ext/object/valid-object')
  , ensureValue        = require('es5-ext/object/valid-value')
  , identity           = require('es5-ext/function/identity')
  , partial            = require('es5-ext/function/#/partial')
  , d                  = require('d')
  , ee                 = require('event-emitter')
  , memoizeMethods     = require('memoizee/methods-plain')
  , getNormalizer      = partial.call(require('memoizee/normalizers/get-fixed'), 2)
  , ensureIdent        = require('dom-ext/element/ensure-ident')
  , ensureDocument     = require('dom-ext/html-document/valid-html-document')
  , reflow             = require('dom-ext/html-document/#/reflow')
  , resetForms         = require('html-dom-ext/element/#/reset-forms')
  , SiteNode           = require('./lib/node')
  , resolveRootElement = require('./lib/resolve-root-element')

  , rootNames = { head: true, title: true, body: true }

  , stringify = JSON.stringify;

var SiteTree = module.exports = Object.defineProperties(function (document) {
	if (!(this instanceof SiteTree)) return new SiteTree(document);
	this.document = ensureDocument(document);
}, {
	// Raw view validation function.
	// In this base class raw view, is already resolved view configuration, so it
	// fallbacks to ensureView
	ensureRawView: d(function (conf) { return this.ensureView(conf); }),

	// View validation function
	// (this method may be overriden on subclasses for custom needs)
	ensureView: d(function (conf) {
		forEach(ensureObject(conf), function (value, key) {
			var isConf;
			if (key[0] === '_') return;
			ensureIdent(key);
			ensureValue(value);
			if (value.class != null) {
				ensureObject(value.class);
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
	root: d(null),
	current: d(null),

	// Resolves raw view input into view configuration object.
	// By default it's assumed as view configuration object already so there's nothing to do
	// However some SiteTree extension may rely on custom format which will demand resolution step
	resolveRawView: d(identity),

	// Resolves view configuration into DOM map
	// It's done once, and on demand, so right before we want to present given view in window
	resolveView: d(function (conf, context) {
		var map = [];
		forEach(conf, function (setup, id) {
			var conf, isConf;
			if (id[0] === '_') return;
			map.push(conf = {});
			if (rootNames[id]) conf.element = resolveRootElement(this.document, id);
			else conf.element = this.document.getElementById(id);
			if (!conf.element) throw new TypeError("Could not find element of id " + stringify(id));
			if (setup.class) {
				conf.class = setup.class;
				isConf = true;
			}
			if (setup.content != null) {
				conf.content = this.resolveTemplate(setup.content, context);
				return;
			}
			if (setup.prepend != null) {
				conf.prepend = this.resolveTemplate(setup.prepend, context);
				isConf = true;
			}
			if (setup.append != null) {
				conf.append = this.resolveTemplate(setup.append, context);
				isConf = true;
			}
			if (isConf) return;
			conf.content = this.resolveTemplate(setup, context);
		}, this);
		return map;
	}),

	// Resolves template into DOM (document fragment)
	// (this method may be overriden on subclasses for custom needs)
	resolveTemplate: d(function (tpl, context) { return tpl.call(context); }),

	// Loads provided raw view, so it's current
	load: d(function (conf, context) {
		var node = this._resolve(conf, context[conf._match], context), current = this.current, common;
		if (current === node) return;
		if (current) {
			common = find.call(current.ancestors, function (ancestor) {
				return includes.call(this, ancestor);
			}, node.ancestors);
			while (current !== common) {
				current._unload();
				current = current.parent;
			}
		} else {
			current = this;
		}
		node.ancestors.slice(0, node.ancestors.indexOf(current)).reverse().forEach(function (ancestor) {
			ancestor._load();
		});
		node._load();
		this.current = node;
		// Assure repaint after content change
		reflow.call(this.document);
		this.emit('load', node);
	}),

	// After elements are exposed in a view. Proceed with reset operations
	// (this method may be overriden for custom needs)
	resetElement: d(function (element) {
		if (element.nodeType !== 1) return;
		resetForms.call(element);
	})
}, memoizeMethods({
	// Resolves template (for given template/matcher combination should be invoked only once)
	_resolve: d(function (conf, matcher, context) {
		var parent;
		conf = this.resolveRawView(this.constructor.ensureView(conf));
		if (conf._parent) parent = this._resolve(conf._parent, context[conf._parent._match], context);
		else parent = this;
		return new SiteNode(conf, context, parent);
	}, { getNormalizer: getNormalizer })
}))));
