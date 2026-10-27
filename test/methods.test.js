'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('koa')

const match = require('..')()

describe('match(path)[method](fn)', () => {
  describe('when the route matches', () => {
    it('should execute the fn', async () => {
      const app = new Koa()
      app.use(
        match('/a/b').get(function (ctx) {
          ctx.status = 204
        })
      )

      await request(app.callback()).get('/a/b').expect(204)
    })

    it('should populate this.params', async () => {
      const app = new Koa()
      app.use(
        match('/:a/:b').get(function (ctx) {
          ctx.status = 204
          assert.equal('a', ctx.params.a)
          assert.equal('b', ctx.params.b)
        })
      )

      await request(app.callback()).get('/a/b').expect(204)
    })

    it('should support OPTIONS', async () => {
      const app = new Koa()
      app.use(
        match('/:a/:b').get(function (ctx) {
          ctx.status = 204
          assert.equal('a', ctx.params.a)
          assert.equal('b', ctx.params.b)
        })
      )

      await request(app.callback())
        .options('/a/b')
        .expect('Allow', /\bHEAD\b/)
        .expect('Allow', /\bGET\b/)
        .expect('Allow', /\bOPTIONS\b/)
        .expect(204)
    })

    it('should support custom OPTIONS handler', async () => {
      const app = new Koa()
      app.use(
        match('/:a/:b')
          .get(function (ctx) {
            ctx.status = 204
          })
          .options(function (ctx) {
            ctx.status = 200
            ctx.body = 'custom options'
          })
      )

      await request(app.callback()).options('/a/b').expect(200).expect('custom options')
    })

    it('should support HEAD as GET', async () => {
      const app = new Koa()
      let called = false
      app.use(
        match('/:a/:b').get(function (ctx) {
          ctx.status = 204
          called = true
          assert.equal('a', ctx.params.a)
          assert.equal('b', ctx.params.b)
        })
      )

      await request(app.callback()).head('/a/b').expect(204)

      assert(called)
    })

    it('should throw error when method is already defined', () => {
      const route = match('/a/b')
      route.get(() => {})
      assert.throws(() => {
        route.get(() => {})
      }, /Method GET is already defined for this route!/)
    })
  })

  describe('when the route does not match', () => {
    it('should not execute the fn', async () => {
      const app = new Koa()
      app.use(
        match('/a/b').get(function (ctx) {
          ctx.status = 204
        })
      )

      await request(app.callback()).get('/a').expect(404)
    })
  })

  describe('when the method does not match', () => {
    it('should 405', async () => {
      const app = new Koa()
      app.use(
        match('/a/b').get(function (ctx) {
          ctx.status = 204
        })
      )

      await request(app.callback())
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
      app.use(
        match('/a/b')
          .get(function (ctx) {
            ctx.status = 204
          })
          .post(function (ctx) {
            ctx.status = 201
          })
      )

      await Promise.all([
        request(app.callback()).get('/a/b').expect(204),
        request(app.callback()).post('/a/b').expect(201)
      ])
    })

    it('should support OPTIONS', async () => {
      const app = new Koa()
      app.use(
        match('/:a/:b')
          .get(function (ctx) {
            ctx.status = 204
            assert.equal('a', ctx.params.a)
            assert.equal('b', ctx.params.b)
          })
          .post(function (ctx) {
            ctx.status = 201
          })
      )

      await request(app.callback())
        .options('/a/b')
        .expect('Allow', /\bHEAD\b/)
        .expect('Allow', /\bGET\b/)
        .expect('Allow', /\bPOST\b/)
        .expect('Allow', /\bOPTIONS\b/)
        .expect(204)
    })
  })
})
