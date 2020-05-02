const compile = require('path-to-regexp').match
const flatten = require('lodash/flattenDeep')
const METHODS = require('http').METHODS
const unique = require('lodash/uniq')

module.exports = function (options) {
  options = options || {}

  return function (path, fn) {
    const match = compile(path, options)

    // app.use(route(:path, function () {}))
    if (Array.isArray(fn) || typeof fn === 'function') {
      if (arguments.length > 2) fn = [].slice.call(arguments, 1)
      if (Array.isArray(fn)) fn = compose(flatten(fn))

      return function (ctx, next) {
        const result = match(ctx.request.path)
        if (!result) return next()

        ctx.params = result.params
        return fn(ctx, next)
      }
    }

    // app.use(route(:path).get(function () {}).post(function () {}))
    return newRoute(match)
  }
}

function newRoute (match) {
  const route = function (ctx, next) {
    const dispatcher = route.dispatcher || (route.dispatcher = createDispatcher(route))
    return dispatcher(ctx, next)
  }

  route.match = match
  route.methods = Object.create(null)

  METHODS.forEach((method) => {
    route[method] =
    route[method.toLowerCase()] = function (fn) {
      if (arguments.length > 2) fn = [].slice.call(arguments, 1)
      if (Array.isArray(fn)) fn = compose(flatten(fn))
      if (typeof route.methods[method] === 'function') throw new Error(`Method ${method} is already defined for this route!`)
      route.methods[method] = fn
      return route
    }
  })

  return route
}

function createDispatcher (route) {
  const match = route.match
  const controllers = route.methods
  if (!controllers.HEAD && controllers.GET) controllers.HEAD = controllers.GET
  const ALLOW = unique(['OPTIONS'].concat(Object.keys(route.methods))).join(',')

  return function (ctx, next) {
    const result = match(ctx.request.path)
    if (!result) return next()

    ctx.params = result.params
    ctx.allow = ALLOW

    const method = ctx.method

    // handle OPTIONS
    if (method === 'OPTIONS') {
      ctx.set('Allow', ALLOW)
      if (controllers.OPTIONS) return controllers.OPTIONS(ctx)
      ctx.status = 204
      return
    }

    // handle other methods
    const fn = controllers[method]
    if (fn) return fn(ctx, next)

    // 405
    ctx.set('Allow', ALLOW)
    ctx.status = 405
  }
}

function compose (fns) {
  return function (ctx, next) {
    let rn = fns[fns.length - 1].bind(null, ctx, next)

    for (let n = fns.length - 2; n >= 0; n--) {
      rn = fns[n].bind(null, ctx, rn)
    }

    return rn()
  }
}
