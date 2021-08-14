'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('koa')

const match = require('..')()

describe('match(path, fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b', (ctx) => {
        ctx.status = 204
      }))

      await request(app.listen()).get('/a/b').expect(204)
    })

    it('should populate this.params', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)', (ctx) => {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      await request(app.listen()).get('/a/b').expect(204)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b', (ctx) => {
        ctx.status = 204
      }))

      await request(app.listen()).get('/a').expect(404)
    })
  })
})

describe('match(path, fns...)', () => {
  it('should support multiple functions', async () => {
    let calls = 0
    function call(ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', call, call, call))

    await request(app.listen()).get('/a/b').expect(200).expect('3')
  })

  it('should support nested functions', async () => {
    let calls = 0
    function call(ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', [call, [call, call]]))

    await request(app.listen()).get('/a/b').expect(200).expect('3')
  })

  it('should support both multiple and nested functions', async () => {
    let calls = 0
    function call(ctx, next) {
      return next().then(() => {
        ctx.body = String(++calls)
      })
    }

    const app = new Koa()
    app.use(match('/a/b', [call, [call, call]], call, [call, call]))

    await request(app.listen()).get('/a/b').expect(200).expect('6')
  })
})

describe('match(path)[method](fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      await request(app.listen()).get('/a/b').expect(204)
    })

    it('should populate this.params', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      await request(app.listen()).get('/a/b').expect(204)
    })

    it('should support OPTIONS', async () => {
      const app = new Koa()
      app.use(match('/:a(a)/:b(b)').get(function (ctx, next) {
        ctx.status = 204
        assert.equal('a', ctx.params.a)
        assert.equal('b', ctx.params.b)
      }))

      await request(app.listen())
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

      await request(app.listen()).head('/a/b').expect(204)

      assert(called)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', async () => {
      const app = new Koa()
      app.use(match('/a/b').get(function (ctx) {
        ctx.status = 204
      }))

      await request(app.listen())
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

      await request(app.listen())
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

      await Promise.all([
        async () => {
          await request(app.listen()).get('/a/b').expect(204)
        },
        async () => {
          await request(app.listen()).post('/a/b').expect(201)
        }
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

      await request(app.listen())
        .options('/a/b')
        .expect('Allow', /\bHEAD\b/)
        .expect('Allow', /\bGET\b/)
        .expect('Allow', /\bPOST\b/)
        .expect('Allow', /\bOPTIONS\b/)
        .expect(204)
    })
  })
})
