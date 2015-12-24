'use strict'

const METHODS = require('http').METHODS
const unique = require('lodash').unique
const compose = require('composition')
const flatten = require('flatten')

module.exports = function (options) {
  options = options || {}
  const parse = require('path-match')(options)

  return function (path, fn) {
    const match = parse(path)

    // app.use(route(:path, function* () {}))
    if (Array.isArray(fn) || typeof fn === 'function') {
      if (arguments.length > 2) fn = [].slice.call(arguments, 1)
      if (Array.isArray(fn)) fn = compose(flatten(fn))

      return function* (next) {
        const params = match(this.request.path, this.params)
        if (!params) return yield* next

        this.params = params
        yield* fn.call(this, next)
      }
    }

    // app.use(route(:path).get(function* () {}).post(function* () {}))
    return new Route(match)
  }
}

function Route(match) {
  this.match = match
  this.methods = Object.create(null)

  // pretend it's a generator function
  this.constructor = function* () {}.constructor

  // hacky, but it works!
  this.call = (ctx, next) => {
    const dispatcher = this.dispatcher || (this.dispatcher = this.createDispatcher())
    return dispatcher.call(ctx, next)
  }
}

METHODS.forEach(method => {
  Route.prototype[method] =
  Route.prototype[method.toLowerCase()] = function (fn) {
    if (arguments.length > 2) fn = [].slice.call(arguments, 1)
    if (Array.isArray(fn)) fn = compose(flatten(fn))
    if (typeof this.methods[method] === 'function') throw new Error(`Method ${method} is already defined for this route!`)
    this.methods[method] = fn
    return this
  }
})

Route.prototype.createDispatcher = function () {
  const match = this.match
  const controllers = this.methods
  if (!controllers.HEAD && controllers.GET) controllers.HEAD = controllers.GET
  const ALLOW = unique(['OPTIONS'].concat(Object.keys(this.methods))).join(',')

  return function* (next) {
    const params = match(this.request.path, this.params)
    if (!params) return yield* next

    this.params = params
    this.allow = ALLOW

    const method = this.method

    // handle OPTIONS
    if (method === 'OPTIONS') {
      this.set('Allow', ALLOW)
      if (controllers.OPTIONS) return yield controllers.OPTIONS.call(this)
      this.status = 204
      return
    }

    // handle other methods
    const fn = controllers[method]
    if (fn) return yield fn.call(this)

    // 405
    this.set('Allow', ALLOW)
    this.status = 405
  }
}
