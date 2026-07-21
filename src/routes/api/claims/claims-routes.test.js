import { Server } from '@hapi/hapi'
import { POULTRY_SCHEME, AHWR_SCHEME } from 'ffc-ahwr-common-library'
import { claimsHandlers } from './claims-routes.js'
import {
  createClaimHandler,
  isURNUniqueHandler,
  getClaimHandler,
  updateClaimStatusHandler,
  updateClaimDataHandler,
  getClaimsCountHandler
} from './claims-controller.js'
import { searchClaims } from '../../../repositories/claim/claim-search-repository.js'

jest.mock('./claims-controller.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../repositories/claim/claim-search-repository.js')
jest.mock('../../../event-publisher/index.js')

const mockLogger = {
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  setBindings: jest.fn(() => {})
}
const mockDb = jest.fn()

describe('claims-routes', () => {
  let server

  beforeAll(async () => {
    server = new Server()
    server.route(claimsHandlers)
    server.decorate('request', 'logger', mockLogger)
    server.decorate('request', 'db', mockDb)
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

  describe('GET /api/claims/count', () => {
    it('should validate payload and call correct handler', async () => {
      getClaimsCountHandler.mockImplementation(async (_, h) => {
        return h.response({ count: 2 }).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/count?cph=123456789&herdId=0e4f55ea-ed42-4139-9c46-c75ba63b0742'
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ count: 2 })
      expect(getClaimsCountHandler).toHaveBeenCalledTimes(1)
    })

    it('should accept the poultry scheme and pass it through to the handler', async () => {
      getClaimsCountHandler.mockImplementation(async (_, h) => {
        return h.response({ count: 1 }).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: `/api/claims/count?cph=123456789&herdId=0e4f55ea-ed42-4139-9c46-c75ba63b0742&scheme=${POULTRY_SCHEME}`
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ count: 1 })
      expect(getClaimsCountHandler).toHaveBeenCalledTimes(1)
      expect(getClaimsCountHandler.mock.calls[0][0].query).toEqual({
        cph: '123456789',
        herdId: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
        scheme: POULTRY_SCHEME
      })
    })

    it('should accept the ahwr scheme and pass it through to the handler', async () => {
      getClaimsCountHandler.mockImplementation(async (_, h) => {
        return h.response({ count: 3 }).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: `/api/claims/count?cph=123456789&herdId=0e4f55ea-ed42-4139-9c46-c75ba63b0742&scheme=${AHWR_SCHEME}`
      })

      expect(res.statusCode).toBe(200)
      expect(getClaimsCountHandler).toHaveBeenCalledTimes(1)
      expect(getClaimsCountHandler.mock.calls[0][0].query).toEqual({
        cph: '123456789',
        herdId: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
        scheme: AHWR_SCHEME
      })
    })

    it('should reject an invalid scheme value with 400 and not call the handler', async () => {
      getClaimsCountHandler.mockImplementation(async (_, h) => {
        return h.response({ count: 0 }).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/count?cph=123456789&herdId=0e4f55ea-ed42-4139-9c46-c75ba63b0742&scheme=alpacas'
      })

      expect(res.statusCode).toBe(400)
      expect(getClaimsCountHandler).not.toHaveBeenCalled()
    })

    it('should still accept requests without a scheme (legacy behaviour)', async () => {
      getClaimsCountHandler.mockImplementation(async (_, h) => {
        return h.response({ count: 2 }).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/count?cph=123456789&herdId=0e4f55ea-ed42-4139-9c46-c75ba63b0742'
      })

      expect(res.statusCode).toBe(200)
      expect(getClaimsCountHandler).toHaveBeenCalledTimes(1)
      expect(getClaimsCountHandler.mock.calls[0][0].query).toEqual({
        cph: '123456789',
        herdId: '0e4f55ea-ed42-4139-9c46-c75ba63b0742'
      })
    })

    it('should handle errors from handler', async () => {
      getClaimsCountHandler.mockImplementation(async () => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/count?cph=123456789&herdId=0e4f55ea-ed42-4139-9c46-c75ba63b0742'
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

  describe('PUT /api/claims/update-by-reference', () => {
    test('Update claim call should pass request through to handler for valid request', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/update-by-reference',
        payload: {
          status: 'READY_TO_PAY',
          user: 'admin',
          reference: 'RESH-O9UD-0025'
        }
      }

      updateClaimStatusHandler.mockImplementationOnce(async (_, h) => {
        return h.response().code(200)
      })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateClaimStatusHandler).toHaveBeenCalledTimes(1)
    })

    test('Update claim call should pass request through to handler for valid request with optional payload element', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/update-by-reference',
        payload: {
          status: 'READY_TO_PAY',
          user: 'admin',
          reference: 'RESH-O9UD-0025',
          note: 'This is a note'
        }
      }

      updateClaimStatusHandler.mockImplementationOnce(async (_, h) => {
        return h.response().code(200)
      })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateClaimStatusHandler).toHaveBeenCalledTimes(1)
    })

    test('Update claim call should fail when reference is not provided', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/update-by-reference',
        payload: {
          status: 9,
          user: 'admin'
        }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /api/claims/search', () => {
    describe('with a valid search payload', () => {
      const resultSet = { total: 1, claims: [{ reference: 'REBC-VA4R-TRL7' }] }
      const payload = {
        search: { text: '', type: 'reset' },
        agreementType: 'PBR',
        status: 'AGREED',
        species: 'sheep',
        offset: 0,
        limit: 20,
        sort: { field: 'createdAt', direction: 'DESC' }
      }
      let res

      beforeEach(async () => {
        searchClaims.mockResolvedValueOnce(resultSet)
        res = await server.inject({
          method: 'POST',
          url: '/api/claims/search',
          payload
        })
      })

      it('returns 200', () => {
        expect(res.statusCode).toBe(200)
      })

      it('returns the search results', () => {
        expect(res.result).toEqual(resultSet)
      })

      it('passes the search criteria including agreementType through to searchClaims', () => {
        expect(searchClaims).toHaveBeenCalledWith(
          mockDb,
          {
            search: { text: '', type: 'reset' },
            agreementType: 'PBR',
            status: 'AGREED',
            species: 'sheep'
          },
          0,
          20,
          { field: 'createdAt', direction: 'DESC' }
        )
      })

      it('passes the search criteria including status through to searchClaims', () => {
        expect(searchClaims).toHaveBeenCalledWith(
          mockDb,
          {
            search: { text: '', type: 'reset' },
            agreementType: 'PBR',
            status: 'AGREED',
            species: 'sheep'
          },
          0,
          20,
          { field: 'createdAt', direction: 'DESC' }
        )
      })

      it('passes the search criteria including species through to searchClaims', () => {
        expect(searchClaims).toHaveBeenCalledWith(
          mockDb,
          {
            search: { text: '', type: 'reset' },
            agreementType: 'PBR',
            status: 'AGREED',
            species: 'sheep'
          },
          0,
          20,
          { field: 'createdAt', direction: 'DESC' }
        )
      })
    })

    it('rejects an invalid agreementType with 400 and does not call searchClaims', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/search',
        payload: { agreementType: 'alpacas' }
      })

      expect(res.statusCode).toBe(400)
      expect(searchClaims).not.toHaveBeenCalled()
    })

    it('rejects an invalid status with 400 and does not call searchClaims', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/search',
        payload: { status: 'alpacas' }
      })

      expect(res.statusCode).toBe(400)
      expect(searchClaims).not.toHaveBeenCalled()
    })

    it('rejects an invalid species with 400 and does not call searchClaims', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/search',
        payload: { species: 'alpacas' }
      })

      expect(res.statusCode).toBe(400)
      expect(searchClaims).not.toHaveBeenCalled()
    })
  })

  describe('PUT /api/claims/{reference}/data', () => {
    test('Update claim data call should pass request through to handler for valid request', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/FUBC-JTTU-SDQ7/data',
        payload: { vetsName: 'New Vet', user: 'tester', note: 'Changed vet name' }
      }

      updateClaimDataHandler.mockImplementationOnce(async (_, h) => {
        return h.response().code(200)
      })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateClaimDataHandler).toHaveBeenCalledTimes(1)
    })

    test('Update claim data call should pass request through to handler for valid request for alternate element', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/FUBC-JTTU-SDQ7/data',
        payload: { vetRCVSNumber: '1234567', user: 'tester', note: 'Changed vet name' }
      }

      updateClaimDataHandler.mockImplementationOnce(async (_, h) => {
        return h.response().code(200)
      })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateClaimDataHandler).toHaveBeenCalledTimes(1)
    })

    test('Update claim call should fail when required value is not provided', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/FUBC-JTTU-SDQ7/data',
        payload: { vetRCVSNumber: '1234567', user: 'tester' }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })
})
