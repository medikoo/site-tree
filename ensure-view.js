'use strict';

var forEach        = require('es5-ext/object/for-each')
  , ensureCallable = require('es5-ext/object/valid-callable')
  , ensureObject   = require('es5-ext/object/valid-object')
  , ensureValue    = require('es5-ext/object/valid-value')
  , ensureIdent    = require('dom-ext/element/ensure-ident');

module.exports = function (conf, tree) {
	ensureObject(tree);
	ensureCallable(tree.ensureTemplate);
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
			tree.ensureTemplate(value.content);
			isConf = true;
			if (value.prepend != null) {
				throw new TypeError("'prepend' configuration should not be used together with 'content'");
			}
			if (value.append != null) {
				throw new TypeError("'append' configuration should not be used together with 'content'");
			}
		} else {
			if (value.prepend != null) {
				tree.ensureTemplate(value.prepend);
				isConf = true;
			}
			if (value.append != null) {
				tree.ensureTemplate(value.append);
				isConf = true;
			}
		}
		if (!isConf) tree.ensureTemplate(value);
	});
	return conf;
};
