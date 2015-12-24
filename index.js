'use strict'

const METHODS = require('http').METHODS.map(method => method.toLowerCase())
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
    {
      const route = new Route(match)
      let dispatch

      return function* (next) {
        if (!dispatch) route.createDispatcher()
        return yield* dispatch.call(this, next)
      }
    }
  }
}

function Route(match) {
  this.match = match
  this.methods = Object.create(null)
}

METHODS.forEach(method => {
  Route.prototype[method] = function (fn) {
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
  if (!controllers.head && controllers.get) controllers.head = controllers.get
  const ALLOW = Object.keys(this.methods).join(',').toUpperCase()

  return function* (next) {
    const params = match(this.request.path, this.params)
    if (!params) return yield* next

    this.params = params
    this.allow = ALLOW

    const method = this.method

    // handle OPTIONS
    if (method === 'OPTIONS') {
      this.set('Allow', ALLOW)
      if (controllers.options) return yield controllers.options.call(this)
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
