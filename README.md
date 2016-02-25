
# Koa Path Match

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

A simple routing wrapper around [path-match](https://github.com/expressjs/path-match).
Similar to [koa-route](https://github.com/koajs/route), except it optionally handles methods better.
All of these routers use [path-to-regexp](https://github.com/component/path-to-regexp)
underneath, which is what Express uses as well.

```js
const route = require('koa-path-match')({/* options passed to path-to-regexp */})

app.use(route('/:id(\\d+)', (ctx, next) => {
  const id = ctx.params.id

  // do stuff
  switch (ctx.request.method) {

  }
}))
```

Or you can create middleware per method:

```js
app.use(route('/:id(\\d+)')
  .get(async ctx => {
    ctx.body = await Things.getById(ctx.params.id)
  })
  .delete(async ctx => {
    await Things.delete(ctx.params.id)
    ctx.status = 204
  })
)
```


## API

### route(path, fns...)

`path`s are just like Express routes. `fns` is either a single middleware
or nested arrays of middleware, just like Express.

### const router = route(path)

When you don't set `fns` in the `route()` function, a router instance is returned.

### router\[method\]\(fns...\)

Define a middleware just for a specific method.

```js
app.use(route('/:id(\\d+)').get(await ctx => {
  ctx.body = yield Things.getById(ctx.params.id)
}))
```

- `next` is not passed as a parameter.
  I consider this an anti-pattern in Koa - one route/method, one function.

### this.params

Any keys defined in the path will be set to `ctx.params`,
overwriting any already existing keys defined.

[npm-image]: https://img.shields.io/npm/v/koa-path-match.svg?style=flat
[npm-url]: https://npmjs.org/package/koa-path-match
[travis-image]: https://img.shields.io/travis/koajs/path-match/master.svg?style=flat
[travis-url]: https://travis-ci.org/koajs/path-match
[codecov-image]: https://img.shields.io/codecov/c/github/koajs/path-match/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/koajs/path-match
[david-image]: http://img.shields.io/david/koajs/path-match.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/path-match
[license-image]: http://img.shields.io/npm/l/koa-path-match.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/koa-path-match.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/koa-path-match
