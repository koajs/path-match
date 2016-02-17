'use strict'

const request = require('supertest')
const assert = require('assert')
const koa = require('koa')

const match = require('..')()

describe('match(path, fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', (done) => {
      const app = koa()
      app.use(match('/a/b', function* (next) {
        this.status = 204
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })

    it('should populate this.params', (done) => {
      const app = koa()
      app.use(match('/:a(a)/:b(b)', function* (next) {
        this.status = 204
        assert.equal('a', this.params.a)
        assert.equal('b', this.params.b)
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', (done) => {
      const app = koa()
      app.use(match('/a/b', function* (next) {
        this.status = 204
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
    function* call(next) {
      yield next
      this.body = String(++calls)
    }

    const app = koa()
    app.use(match('/a/b', call, call, call))

    request(app.listen())
    .get('/a/b')
    .expect(200)
    .expect('3', done)
  })

  it('should support nested functions', (done) => {
    let calls = 0
    function* call(next) {
      yield next
      this.body = String(++calls)
    }

    const app = koa()
    app.use(match('/a/b', [call, [call, call]]))

    request(app.listen())
    .get('/a/b')
    .expect(200)
    .expect('3', done)
  })

  it('should support both multiple and nested functions', (done) => {
    let calls = 0
    function* call(next) {
      yield next
      this.body = String(++calls)
    }

    const app = koa()
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
      const app = koa()
      app.use(match('/a/b').get(function* (next) {
        this.status = 204
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })

    it('should populate this.params', (done) => {
      const app = koa()
      app.use(match('/:a(a)/:b(b)').get(function* (next) {
        this.status = 204
        assert.equal('a', this.params.a)
        assert.equal('b', this.params.b)
      }))

      request(app.listen())
      .get('/a/b')
      .expect(204, done)
    })

    it('should support OPTIONS', (done) => {
      const app = koa()
      app.use(match('/:a(a)/:b(b)').get(function* (next) {
        this.status = 204
        assert.equal('a', this.params.a)
        assert.equal('b', this.params.b)
      }))

      request(app.listen())
      .options('/a/b')
      .expect('Allow', /\bHEAD\b/)
      .expect('Allow', /\bGET\b/)
      .expect('Allow', /\bOPTIONS\b/)
      .expect(204, done)
    })

    it('should support HEAD as GET', (done) => {
      const app = koa()
      let called = false
      app.use(match('/:a(a)/:b(b)').get(function* (next) {
        this.status = 204
        called = true
        assert.equal('a', this.params.a)
        assert.equal('b', this.params.b)
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
      const app = koa()
      app.use(match('/a/b').get(function* (next) {
        this.status = 204
      }))

      request(app.listen())
      .get('/a')
      .expect(404, done)
    })
  })

  describe('when the method does not match', () => {
    it('should 405', (done) => {
      const app = koa()
      app.use(match('/a/b').get(function* (next) {
        this.status = 204
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
