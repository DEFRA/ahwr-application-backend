import { Server } from '@hapi/hapi'
import { claimHandlers } from './claims-routes.js'
import {
  createClaimHandler,
  isURNUniqueHandler,
  getClaimHandler
} from './claims-controller.js'

jest.mock('./claims-controller.js')

describe('claims-routes', () => {
  let server

  beforeAll(async () => {
    server = new Server()
    server.route(claimHandlers)
    await server.initialize()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/claims', () => {
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
      createClaimHandler.mockImplementation(async () => {
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

  describe('POST /api/claims/is-urn-unique', () => {
    it('should validate payload and call correct handler', async () => {
      const payload = {
        sbi: '123456789',
        laboratoryURN: 'URN34567ddd'
      }
      isURNUniqueHandler.mockImplementation(async (_, h) => {
        return h.response({ isURNUnique: true }).code(200)
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/is-urn-unique',
        payload
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ isURNUnique: true })
      expect(isURNUniqueHandler).toHaveBeenCalledTimes(1)
      expect(isURNUniqueHandler.mock.calls[0][0].payload).toEqual(payload)
    })

    it('should handle errors from handler', async () => {
      const payload = {
        sbi: '123456789',
        laboratoryURN: 'URN34567ddd'
      }
      isURNUniqueHandler.mockImplementation(async () => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/is-urn-unique',
        payload
      })

      expect(res.statusCode).toBe(500)
    })
  })

  describe('GET /api/claims/{reference}', () => {
    it('should validate payload and call correct handler', async () => {
      const mockResult = {
        applicationReference: 'IAHW-G3CL-V59P',
        createdAt: '2025-04-24T08:24:24.092Z',
        data: {
          amount: 522,
          claimType: 'R',
          dateOfTesting: '2025-04-24T00:00:00.000Z',
          dateOfVisit: '2025-04-25T00:00:00.000Z',
          laboratoryURN: 'w5436346ret',
          numberAnimalsTested: '10',
          speciesNumbers: 'yes',
          testResults: 'negative',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1111111',
          vetsName: 'Mr C test'
        },
        herd: {},
        reference: 'REBC-VA4R-TRL7',
        status: 'IN_CHECK',
        statusHistory: [],
        type: 'REVIEW',
        updateHistory: [
          {
            createdAt: '2025-04-25T13:05:39.937Z',
            createdBy: 'Carroll, Aaron',
            eventType: 'claim-vetsName',
            id: 'e3d320b7-b2cf-469a-903f-ead7587d98e9',
            newValue: 'Mr C test',
            note: 'Updated to check event',
            oldValue: 'Mr B Test',
            updatedProperty: 'vetsName'
          }
        ]
      }

      getClaimHandler.mockImplementation(async (_, h) => {
        return h.response(mockResult).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/REBC-VA4R-TRL7'
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual(mockResult)
      expect(getClaimHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle errors from handler', async () => {
      getClaimHandler.mockImplementation(async () => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/REBC-VA4R-TRL7'
      })

      expect(res.statusCode).toBe(500)
    })
  })
})
