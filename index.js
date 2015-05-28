// View tree

'use strict';

var find           = require('es5-ext/array/#/find')
  , includes       = require('es5-ext/array/#/contains')
  , assign         = require('es5-ext/object/assign')
  , partial        = require('es5-ext/function/#/partial')
  , d              = require('d')
  , ee             = require('event-emitter')
  , memoizeMethods = require('memoizee/methods-plain')
  , getNormalizer  = partial.call(require('memoizee/normalizers/get-fixed'), 2)
  , ensureDocument = require('dom-ext/html-document/valid-html-document')
  , reflow         = require('dom-ext/html-document/#/reflow')
  , resetForms     = require('html-dom-ext/element/#/reset-forms')
  , ensureView     = require('./ensure-view')
  , SiteNode       = require('./lib/node');

var SiteTree = module.exports = function (document) {
	if (!(this instanceof SiteTree)) return new SiteTree(document);
	this.document = ensureDocument(document);
};

ee(Object.defineProperties(SiteTree.prototype, assign({
	root: d(null),
	current: d(null),

	// Loads given view conf, so it's current
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

	// Default template function resolver, it should return documentFragment instance
	// (this method may be overriden for custom needs)
	resolveTemplate: d(function (fn, context) { return fn.call(context); }),

	// After elements are exposed in a view. Proceed with reset operations
	// (this method may be overriden for custom needs)
	resetElement: d(function (element) {
		if (element.nodeType !== 1) return;
		resetForms.call(element);
	})
}, memoizeMethods({
	// Resolves template (for given template/context combination should be invoked only once)
	_resolve: d(function (conf, matcher, context) {
		if (!ensureView(conf)._parent) return new SiteNode(conf, context, this);
		return new SiteNode(conf, context,
			this._resolve(conf._parent, context[conf._parent._match], context));
	}, { getNormalizer: getNormalizer })
}))));
