'use strict';

module.exports = function (t, a) {
	a(t(document, 'html'), document.documentElement);
	a(t(document, 'head'), document.getElementsByTagName('head')[0]);
	a(t(document, 'body'), document.body);
};
