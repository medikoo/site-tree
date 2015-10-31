'use strict';

module.exports = function (t, a) {
	var div = document.createElement('div'), link;

	div.appendChild(document.createElement('div'));
	div.appendChild(document.createElement('div'));
	div.appendChild(document.createElement('div'));
	link = div.firstChild.appendChild(document.createElement('link'));
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', '/foo.css');

	a(Array.isArray(t(div.childNodes)), true);
};
