'use strict'

const request = require('supertest')
const Koa = require('koa')

const match = require('..')()

describe('URLPattern behavior', () => {
  it('should not decode params', async () => {
    const app = new Koa()
    app.use(
      match('/users/:id', (ctx) => {
        ctx.body = ctx.params.id
      })
    )

    await request(app.callback()).get('/users/caf%C3%A9').expect(200).expect('caf%C3%A9')
  })

  it('should match case-sensitively by default', async () => {
    const app = new Koa()
    app.use(
      match('/Users/:id', (ctx) => {
        ctx.status = 204
      })
    )

    await request(app.callback()).get('/users/1').expect(404)
  })

  it('should pass options to URLPattern', async () => {
    const app = new Koa()
    const matchIgnoreCase = require('..')({ ignoreCase: true })
    app.use(
      matchIgnoreCase('/Users/:id', (ctx) => {
        ctx.body = ctx.params.id
      })
    )

    await request(app.callback()).get('/users/1').expect(200).expect('1')
  })
})
