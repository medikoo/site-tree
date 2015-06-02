// Ensures that given object is a SiteTree instance

'use strict';

var SiteTree = require('./');

module.exports = function (obj) {
	if (obj instanceof SiteTree) return obj;
	throw new TypeError(obj + " is not a SiteTree instance");
};
