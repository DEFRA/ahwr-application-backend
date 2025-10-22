import { Server } from '@hapi/hapi'
import { claimHandlers } from './claims-routes.js'
import { createClaimHandler } from './claims-controller.js'

jest.mock('./claims-controller.js', () => ({
  createClaimHandler: jest.fn()
}))

describe('claims-routes', () => {
  describe('POST /api/claims', () => {
    let server

    beforeAll(async () => {
      server = new Server()
      server.route(claimHandlers)
      await server.initialize()
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should validate payload and call correct handler', async () => {
      const payload = {
        applicationReference: 'IAHW-AAAA-AAAA',
        sbi: '123456789',
        typeOfLivestock: 'beef',
        claimType: 'review'
      }

      createClaimHandler.mockImplementation(async (_, h) => {
        return h.response({ success: true }).code(200)
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims',
        payload
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ success: true })
      expect(createClaimHandler).toHaveBeenCalledTimes(1)
      expect(createClaimHandler.mock.calls[0][0].payload).toEqual(payload)
    })

    it('should handle errors from handler', async () => {
      createClaimHandler.mockImplementation(async (request, h) => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims',
        payload: { applicationReference: 'IAHW-AAAA-AAAA' }
      })

      expect(res.statusCode).toBe(500)
    })
  })
})
