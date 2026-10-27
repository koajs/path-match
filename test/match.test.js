'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('koa')

const match = require('..')()

describe('match(path, fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(
        match('/a/b', (ctx) => {
          ctx.status = 204
        })
      )

      await request(app.callback()).get('/a/b').expect(204)
    })

    it('should populate this.params', async () => {
      const app = new Koa()
      app.use(
        match('/:a/:b', (ctx) => {
          ctx.status = 204
          assert.equal('a', ctx.params.a)
          assert.equal('b', ctx.params.b)
        })
      )

      await request(app.callback()).get('/a/b').expect(204)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', async () => {
      const app = new Koa()
      app.use(
        match('/a/b', (ctx) => {
          ctx.status = 204
        })
      )

      await request(app.callback()).get('/a').expect(404)
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

    await request(app.callback()).get('/a/b').expect(200).expect('3')
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

    await request(app.callback()).get('/a/b').expect(200).expect('3')
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

    await request(app.callback()).get('/a/b').expect(200).expect('6')
  })

  it('should handle errors in middleware chain', async () => {
    const app = new Koa()
    app.use(
      match(
        '/a/b',
        (ctx, next) => next(),
        () => {
          throw new Error('test error')
        },
        (ctx, next) => next()
      )
    )

    await request(app.callback()).get('/a/b').expect(500)
  })
})
