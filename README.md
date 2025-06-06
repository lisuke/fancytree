# ![logo](doc/logo.png?raw=true) Fancytree

[![GitHub version](https://badge.fury.io/gh/mar10%2Ffancytree.svg)](https://github.com/mar10/fancytree/releases/latest)
[![npm](https://img.shields.io/npm/dm/jquery.fancytree.svg)](https://www.npmjs.com/package/jquery.fancytree)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/jquery.fancytree/badge)](https://www.jsdelivr.com/package/npm/jquery.fancytree)
[![StackOverflow: fancytree](https://img.shields.io/badge/StackOverflow-fancytree-blue.svg)](https://stackoverflow.com/questions/tagged/fancytree)
<!-- [![Released with: grunt-yabs](https://img.shields.io/badge/released%20with-grunt--yabs-yellowgreen)](https://github.com/mar10/grunt-yabs) -->
<!-- [![Build Status](https://travis-ci.com/mar10/fancytree.svg?branch=master)](https://travis-ci.com/github/mar10/fancytree) -->
<!-- [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) -->

Fancytree is a JavaScript tree view / tree grid plugin with support for keyboard, inline editing,
filtering, checkboxes, drag'n'drop, and lazy loading.

### NOTE

Fancytree is considered feature-complete. <br>
The code is still maintained and bugfixes will be commited.
However do not expect new major features.

For a modernized and more capable alternative, **consider upgrading** to
[Wunderbaum](https://github.com/mar10/wunderbaum).

### Demo

[ ![sample](doc/teaser2.png?raw=true) ](https://wwWendt.de/tech/fancytree/demo "Live demo")

### Get Started

-   [Try the live demo](https://wwWendt.de/tech/fancytree/demo).
-   [Read the documentation](https://github.com/mar10/fancytree/wiki).
-   [Check the Q&A forum](https://github.com/mar10/fancytree/discussions) or
    [Stackoverflow](https://stackoverflow.com/questions/tagged/fancytree) if you have questions.
-   Play with [jsFiddle](http://jsfiddle.net/mar10/KcxRd/),
    [CodePen](https://codepen.io/mar10/pen/WMWrbq),
    or [Plunker](http://plnkr.co/edit/8sdy3r?p=preview).
-   [Contribute](https://github.com/mar10/fancytree/wiki/HowtoContribute)

### ES6 Quickstart

```js
import $ from "jquery";

import 'jquery.fancytree/dist/skin-lion/ui.fancytree.less';  // CSS or LESS

import {createTree} from 'jquery.fancytree';

import 'jquery.fancytree/dist/modules/jquery.fancytree.edit';
import 'jquery.fancytree/dist/modules/jquery.fancytree.filter';

const tree = createTree('#tree', {
  extensions: ['edit', 'filter'],
  source: {...},
  ...
});
// Note: Loading and initialization may be asynchronous, so the nodes may not be accessible yet.
```

See [module loader support](https://github.com/mar10/fancytree/wiki#use-a-module-loader) and
[API docs](https://wwWendt.de/tech/fancytree/doc/jsdoc/Fancytree_Static.html#createTree).

### Credits

Thanks to all [contributors](https://github.com/mar10/fancytree/contributors).

<!--
### Browser Status Matrix

[![Selenium Test Status](https://saucelabs.com/browser-matrix/sauce-fancytree.svg)](https://saucelabs.com/u/sauce-fancytree)
-->
