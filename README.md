# site-tree
## A DOM based view engine

Allows to configure a website view tree, which allows automated switching between different pages (tree nodes)

##### Basic example:

Let's say we have following HTML files:

_head.html_
```html
<link rel="icon" href="/favicon.png" />
<link rel="stylesheet" href="/style.css" />
```

_body.html_
```html
<header>
  <nav><ul>
    <li><a href="/">Main page</a></li>
  </ul></nav>
</header>
<main>
  <!-- To be filled by extension views -->
</main>
<footer><p>© footer example</p></footer>
```

_homepage.html_
```html
<h1>Homepage of SiteTree demo</h1>
<p>Homepage content ...</p>
```

_subpage.html_
```html
<h1>Subpage of SiteTree demo</h1>
<p>Subpage content ...</p>
```

SiteTree configuration for them may look as:

```javascript
var SiteTree = require('site-tree');

// Initialize SiteTree instance:
var siteTree = new SiteTree(document);

// Configure view nodes:
// Root node
var baseView = {
  title: "SiteTree test page",
	head: function () {
		return htmlToDOM('./head.html');
	},
	body: function () {
		return htmlToDOM('./body.html');
	},
};

// Homepage node
var homepageView = {
	_parent: baseView,
  main: function () {
    return htmlToDOM('./homepage.html');
  }
};

// Subpage node
var subpageView = {
	_parent: baseView,
  main: function () {
    return htmlToDOM('./subpage.html');
  }
};

// Switch between views in document:
// Present homepage
siteTree.load(homepageView);

// Switch to subpage
siteTree.load(subpageView);

// Switch back to homepage
siteTree.load(homepageView)
```

SiteTree expects view functions to return instances of _DocumentFragment_, but its agnostic in how fragments are resolved, it's why above example doesn't expose logic for `htmlToDOM` function.

There are ready solutions that adapt some template formats:
- [domjs-site-tree](https://github.com/medikoo/domjs-site-tree#domjs-site-tree) for [domjs](https://github.com/medikoo/domjs#domjs) style templates
- [html-site-tree](https://github.com/medikoo/html-site-tree#html-site-tree)  for plain HTML templates which allow _ES6 template literal_ style inserts

Above configuration example exposes very basic case, and does not unleash all possibilities of SiteTree, follow below documentation, for all the details

### Installation

	$ npm install site-tree

### API

#### new SiteTree(document)

```javascript
var SiteTree = require('site-tree');

var siteTree = new SiteTree();
```

On initialization _HTMLDocument_ istance needs to be provided.

There's no need to provide any view nodes at this step, instead they should be added to tree on demand (via `siteTree.load` method) at point when we want to show them in document.

#### SiteTree constructor properties:

##### SiteTree.ensureView(conf)

Validates provided view configuration. Used also internally on view load. Can be overriden by extensions

##### SiteTree.ensureTemplate(template)

Validates provided template. Used also internally on view load. Can be overriden by extensions

#### Properties of siteTree instance:

##### siteTree.current

Currently loaded node.

##### siteTree.load(view[, context])

Loads provided `view` configuration into document. `context` is optional (if not provided, plain object is created internally) it's a context in which view functions will be called. It should be used to transport necessary data to the views.

If given view was already loaded in a past (taking also into account eventual `match` setting), then previously generated DOM is reused.

##### siteTree.\_resolveTemplate(templates, context)

Resolves provided template with provided context. Should not be used externally.
Listed in documentation, only to indicate that this method should be overriden by extension when some specific template format is to be used.

##### siteTree.\_resetElement(element)

Invokes reset operation on elements which were just exposed in a document due to view change.
Should not be used externally. Listed in documentation, only to indicate that this method may be overriden for custom needs.

#### Configuration of view nodes

View node is a typical key/value hash map, which says where in a tree node is placed and instructs which and how elements should be altered when view is loaded

##### View map keys

All keys that start with `_` are treated as special instructions:

- __\_parent__ - A parent view configuration. Mandatory if given view is not a root one.
- __\_match__ - Matching instruction: Typically view is resolved once, and generated DOM is reused. However there are cases when we want to generate different view per each entity,
e.g. imagine page which lists properties of some object, for each object we may want to use same view configuration, but we don't want to reuse DOM generated for object A, when we want to show data for object B.  
With `match` we indicate which property of a _context_ (passed to `siteTree.load`) will identify entity for which view is generated. e.g. if `match` is set to `'name'`, then
two different views will be generated for following contexts `{ name: 'Mark' }` and `{ name: 'Paul' }`. However previously generated view will be reused if again we provide context as `{ name: 'Mark' }`.
Matching value in a context doesn't have to be a string, it can be any JavaScript value, it's uniqueness is compared with
[SameValueZero](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero) algorithm

Any other instruction key in core implementation will be ignored (but can be used by extensions).

All other keys are expected to be valid ident values which address specific DOM elements.

Following _core_ elements can be addressed by name:
- `html` (configuration may contain only _attributes_ setting)
- `head`
- `title`
- `body`
- `main`

Any other HTML elements need to be addressed by _id_.

Aside of `html`, `head`, `title` and `body` elements, it is expected that referenced elements exist in a document tree when parent of given node view is loaded, otherwise load of a view will crash with exception.

##### View map values

Each value for a key that addresses element is an update instruction

Configuration value can be directly a function that returns _DocumentFragment_ instance, in such case it's treated as a _replace content_ instruction, then on a view load, content of given element is replaced with one returned by function.

If it's not a function, then it's assumed it's object configuration which can contain following instructions:

- __class__ - Map of class changes to element, e.g. `{ visible: true, hidden: false }` instructs that _visible_ class should be added and _hidden_ removed
- __attributes__ - Map of attribute changes to element, e.g. `{ 'data-foo': 'lorem', 'data-bar': null }` instructs to set value of `data-foo` to 'lorem', and to remove `data-bar` attribute
- __content__ - Function that generates a new content (_DocumentFragment_) for the element.
Should not be used together with _prepend_ or _append_.
- __prepend__ - Function that generates an extra content (_DocumentFragment_) for the element, which will be prepended before element's first child. Should not be used together with _content_
- __append__ - Function that generates an extra content (_DocumentFragment_) for the element, which will be appended after element's last child. Should not be used together with _content_

## Tests [![Build Status](https://travis-ci.org/medikoo/site-tree.svg)](https://travis-ci.org/medikoo/site-tree)

	$ npm test
