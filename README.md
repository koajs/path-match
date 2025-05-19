# Koa Path Match

[![NPM version][npm-image]][npm-url]
[![Node.js CI](https://github.com/koajs/path-match/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/koajs/path-match/actions?query=workflow%3A%22Node.js+CI%22)
[![Test coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

A simple routing wrapper around Node.js 24's native [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern).
Similar to [koa-route](https://github.com/koajs/route), except it optionally handles methods better.
This package uses the native URLPattern API which provides similar functionality to Express's routing.

> NOTE: for older versions, [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) was used. In v5, regexp capture groups were removed, but are added back in v6 with the migration to URLPattern.

> NOTE: koa-path-match@6 only supports node v24+. Please use an older version of koa-path-match for older versions of node.

```js
const route = require('koa-path-match')({/* options passed to URLPattern */})

app.use(route('/:id', (ctx, next) => {
  const id = ctx.params.id

  // do stuff
  switch (ctx.request.method) {

  }
}))
```

Or you can create middleware per method:

```js
app.use(route('/:id')
  .get(async ctx => {
    ctx.body = await Things.getById(ctx.params.id)
  })
  .delete(async ctx => {
    await Things.delete(ctx.params.id)
    ctx.status = 204
  })
)
```

## Requirements

- Node.js 24.0.0 or higher

## Maintainer

- Lead: @jonathanong [@jongleberry](https://twitter.com/jongleberry)
- Team: @koajs/routing

## API

### route(path, fns...)

`path`s are just like Express routes. `fns` is either a single middleware
or nested arrays of middleware, just like Express.

### const router = route(path)

When you don't set `fns` in the `route()` function, a router instance is returned.

### router\[method\]\(fns...\)

Define a middleware just for a specific method.

```js
app.use(route('/:id').get(async ctx => {
  ctx.body = await Things.getById(ctx.params.id)
}))
```

- `next` is not passed as a parameter.
  I consider this an anti-pattern in Koa - one route/method, one function.

### this.params

Any keys defined in the path will be set to `ctx.params`,
overwriting any already existing keys defined.

[npm-image]: https://img.shields.io/npm/v/koa-path-match.svg?style=flat
[npm-url]: https://npmjs.org/package/koa-path-match
[codecov-image]: https://img.shields.io/codecov/c/github/koajs/path-match/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/koajs/path-match
[license-image]: http://img.shields.io/npm/l/koa-path-match.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/koa-path-match.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/koa-path-match
