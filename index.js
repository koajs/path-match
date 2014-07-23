
var compose = require('composition')
var flatten = require('flatten')

module.exports = function (options) {
  options = options || {}
  var parse = require('path-match')(options)

  return function (path, fn) {
    var match = parse(path)
    if (arguments.length > 2) fn = [].slice.call(arguments, 1)
    if (Array.isArray(fn)) fn = compose(flatten(fn))

    if (options.end !== false) return function* (next) {
      var params = match(this.request.path, this.params)
      if (!params) return yield* next

      this.params = params
      yield* fn.call(this, next)
    }

    throw new Error('not implemented')

    // return function* (next) {
    //   var params = match(this.request.path, this.params)
    //   if (!params) return yield* next
    //
    //   this.params = params
    //
    //   var prefix = this.mountPath
    //   var prev = this.request.path
    //   var newpath = this.request.path =
    //   yield* fn.call(this, function* () {
    //     this.request.path = prev
    //     yield* next
    //     this.request.path = newpath
    //   }.call(this))
    //   this.request.path = prev
    // }
  }
}
