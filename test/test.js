'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('koa')
const parallel = require('node-parallel')

const match = require('..')()

describe('match(path, fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', (done) => {
      const app = new Koa()
      app.use(match('/a/b', function (ctx) {
        ctx.status = 204
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })

    it('should populate this.params', (done) => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)', function (ctx) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', (done) => {
      const app = new Koa()
      app.use(match('/a/b', function (ctx) {
        ctx.status = 204
      }))

      request(app.listen())
      .get('/a')
      .expect(404, done)
    })
  })
})

describe('match(path, fns...)', () => {
  it('should support multiple functions', (done) => {
    let calls = 0
    function call(ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', call, call, call))

    request(app.listen())
    .get('/a/b')
    .expect(200)
    .expect('3', done)
  })

  it('should support nested functions', (done) => {
    let calls = 0
    function call(ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', [call, [call, call]]))

    request(app.listen())
    .get('/a/b')
    .expect(200)
    .expect('3', done)
  })

  it('should support both multiple and nested functions', (done) => {
    let calls = 0
    function call(ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', [call, [call, call]], call, [call, call]))

    request(app.listen())
    .get('/a/b')
    .expect(200)
    .expect('6', done)
  })
})

describe('match(path)[method](fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', (done) => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })

    it('should populate this.params', (done) => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })

    it('should support OPTIONS', (done) => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      request(app.listen())
      .options('/a/b')
      .expect('Allow', /\bHEAD\b/)
      .expect('Allow', /\bGET\b/)
      .expect('Allow', /\bOPTIONS\b/)
      .expect(204, done)
    })

    it('should support HEAD as GET', (done) => {
      const app = new Koa()
      let called = false
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        called = true
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      request(app.listen())
      .head('/a/b')
      .expect(204, (err, res) => {
        if (err) return done(err)

        assert(called)
        done()
      })
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', (done) => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      request(app.listen())
      .get('/a')
      .expect(404, done)
    })
  })

  describe('when the method does not match', () => {
    it('should 405', (done) => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      request(app.listen())
      .post('/a/b')
      .expect('Allow', /\bHEAD\b/)
      .expect('Allow', /\bGET\b/)
      .expect('Allow', /\bOPTIONS\b/)
      .expect(405, done)
    })
  })
})

describe('match(path)[method](fn).[method](fn)...', () => {
  describe('when the route matches', () => {
    it('should execute the fn', (done) => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }).post(function (ctx) {
        ctx.status = 201
      }))

      parallel()
      .add(function (cb) {
        request(app.listen())
        .get('/a/b')
        .expect(204, cb)
      })
      .add(function (cb) {
        request(app.listen())
        .post('/a/b')
        .expect(201, cb)
      }).done(done)
    })

    it('should support OPTIONS', (done) => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }).post(function (ctx, next) {
        ctx.status = 201
      }))

      request(app.listen())
      .options('/a/b')
      .expect('Allow', /\bHEAD\b/)
      .expect('Allow', /\bGET\b/)
      .expect('Allow', /\bPOST\b/)
      .expect('Allow', /\bOPTIONS\b/)
      .expect(204, done)
    })
  })
})
