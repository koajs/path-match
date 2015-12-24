
# Koa Path Match

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

A simple routing wrapper around [path-match](https://github.com/expressjs/path-match).
Similar to [koa-route](https://github.com/koajs/route) except it doesn't check methods.
All of these routers use [path-to-regexp](https://github.com/component/path-to-regexp)
underneath, which is what Express uses as well.

```js
const route = require('koa-path-match')({/* options passed to path-to-regexp */})

app.use(route('/:id(\\d+)', function* (next) {
  const id = this.params.id

  // do stuff
  switch (this.request.method) {

  }
}))
```

## API

### route(path, fns...)

`path`s are just like Express routes. `fns` is either a single middleware
or nested arrays of middleware, just like Express.

### this.params

Any keys defined in the path will be set to `this.params`,
overwriting any already existing keys defined.

[npm-image]: https://img.shields.io/npm/v/koa-path-match.svg?style=flat
[npm-url]: https://npmjs.org/package/koa-path-match
[travis-image]: https://img.shields.io/travis/koajs/path-match.svg?style=flat
[travis-url]: https://travis-ci.org/koajs/path-match
[coveralls-image]: https://img.shields.io/coveralls/koajs/path-match.svg?style=flat
[coveralls-url]: https://coveralls.io/r/koajs/path-match?branch=master
[david-image]: http://img.shields.io/david/koajs/path-match.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/path-match
[license-image]: http://img.shields.io/npm/l/koa-path-match.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/koa-path-match.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/koa-path-match
