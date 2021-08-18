'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('koa')

const match = require('..')()

let server

afterEach((done) => {
  if (server && server.close) server.close(done)
  else setImmediate(done)
})

describe('match(path, fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b', (ctx) => {
        ctx.status = 204
      }))

      server = app.listen()
      await request(server).get('/a/b').expect(204)
    })

    it('should populate this.params', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)', (ctx) => {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      server = app.listen()
      await request(server).get('/a/b').expect(204)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b', (ctx) => {
        ctx.status = 204
      }))

      server = app.listen()
      await request(server).get('/a').expect(404)
    })
  })
})

describe('match(path, fns...)', () => {
  it('should support multiple functions', async () => {
    let calls = 0
    function call (ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', call, call, call))

    server = app.listen()
    await request(server).get('/a/b').expect(200).expect('3')
  })

  it('should support nested functions', async () => {
    let calls = 0
    function call (ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', [call, [call, call]]))

    server = app.listen()
    await request(server).get('/a/b').expect(200).expect('3')
  })

  it('should support both multiple and nested functions', async () => {
    let calls = 0
    function call (ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', [call, [call, call]], call, [call, call]))

    server = app.listen()
    await request(server).get('/a/b').expect(200).expect('6')
  })
})

describe('match(path)[method](fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      server = app.listen()
      await request(server).get('/a/b').expect(204)
    })

    it('should populate this.params', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      server = app.listen()
      await request(server).get('/a/b').expect(204)
    })

    it('should support OPTIONS', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      server = app.listen()
      await request(server)
        .options('/a/b')
        .expect('Allow', /\bHEAD\b/)
        .expect('Allow', /\bGET\b/)
        .expect('Allow', /\bOPTIONS\b/)
        .expect(204)
    })

    it('should support HEAD as GET', async () => {
      const app = new Koa()
      let called = false
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        called = true
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      server = app.listen()
      await request(server).head('/a/b').expect(204)

      assert(called)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      server = app.listen()
      await request(server)
        .get('/a')
        .expect(404)
    })
  })

  describe('when the method does not match', () => {
    it('should 405', async () => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      server = app.listen()
      await request(server)
        .post('/a/b')
        .expect('Allow', /\bHEAD\b/)
        .expect('Allow', /\bGET\b/)
        .expect('Allow', /\bOPTIONS\b/)
        .expect(405)
    })
  })
})

describe('match(path)[method](fn).[method](fn)...', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }).post(function (ctx) {
        ctx.status = 201
      }))

      server = app.listen()
      await Promise.all([
        request(server).get('/a/b').expect(204),
        request(server).post('/a/b').expect(201)
      ])
    })

    it('should support OPTIONS', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }).post(function (ctx, next) {
        ctx.status = 201
      }))

      server = app.listen()
      await request(server)
        .options('/a/b')
        .expect('Allow', /\bHEAD\b/)
        .expect('Allow', /\bGET\b/)
        .expect('Allow', /\bPOST\b/)
        .expect('Allow', /\bOPTIONS\b/)
        .expect(204)
    })
  })
})
