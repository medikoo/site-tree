'use strict';

var forEach        = require('es5-ext/object/for-each')
  , ensureCallable = require('es5-ext/object/valid-callable')
  , ensureObject   = require('es5-ext/object/valid-object')
  , ensureIdent    = require('dom-ext/element/ensure-ident');

module.exports = function (conf) {
	forEach(ensureObject(conf), function (value, key) {
		if (key[0] === '_') return;
		ensureIdent(key);
		if (typeof value === 'function') return;
		ensureObject(value);
		if (value.class != null) ensureObject(value.class);
		if (value.content != null) {
			ensureCallable(value.content);
			if (value.prepend != null) {
				throw new TypeError("'prepend' configuration should not be used together with 'content'");
			}
			if (value.append != null) {
				throw new TypeError("'append' configuration should not be used together with 'content'");
			}
		}
		if (value.prepend != null) ensureCallable(value.prepend);
		if (value.append != null) ensureCallable(value.append);
	});
	return conf;
};
