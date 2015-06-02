'use strict';

var SiteTree = require('../');

module.exports = function (t, a) {
	var tree = new SiteTree(document);
	a(t(tree), tree);
	a.throws(function () { t(); }, TypeError);
	a.throws(function () { t({}); }, TypeError);
};
