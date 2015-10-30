'use strict';

var document = require('jsdom').jsdom();

exports.context = document ? {
	document: document,
	setTimeout: setTimeout
} : {};
