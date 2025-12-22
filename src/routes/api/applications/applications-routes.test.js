import Boom from '@hapi/boom'
import { applicationRoutes } from './applications-routes.js'
import { searchApplications } from '../../../repositories/application-repository.js'
import { createServer } from '../../../server.js'

jest.mock('../../../repositories/application-repository.js')

describe('applicationRoutes', () => {
  describe('POST /api/applications', () => {
    const postRoute = applicationRoutes.find(
      (r) => r.method === 'POST' && r.path === '/api/applications'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Validation failed')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(postRoute.options.validate.failAction(mockRequest, null, mockError)).rejects.toEqual(
          Boom.badRequest(mockError)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Create application validation error'
        )
      })
    })
  })

  describe('GET /api/applications', () => {
    const getRoute = applicationRoutes.find(
      (r) => r.method === 'GET' && r.path === '/api/applications'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() => getRoute.options.validate.failAction(mockRequest, null, mockError)).toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(mockError, 'Get application validation error')
      })
    })
  })

  describe('GET /api/applications/{applicationReference}/claims', () => {
    const getRoute = applicationRoutes.find(
      (r) => r.method === 'GET' && r.path === '/api/applications/{applicationReference}/claims'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() => getRoute.options.validate.failAction(mockRequest, null, mockError)).toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Get application claims validation error'
        )
      })
    })
  })

  describe('GET /api/applications/{applicationReference}/herds', () => {
    const getRoute = applicationRoutes.find(
      (r) => r.method === 'GET' && r.path === '/api/applications/{applicationReference}/herds'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() => getRoute.options.validate.failAction(mockRequest, null, mockError)).toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Get application herds validation error'
        )
      })
    })
  })

  describe('GET /api/applications/{applicationReference}', () => {
    const getRoute = applicationRoutes.find(
      (r) => r.method === 'GET' && r.path === '/api/applications/{applicationReference}'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() => getRoute.options.validate.failAction(mockRequest, null, mockError)).toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(mockError, 'Get application validation error')
      })
    })
  })

  describe('POST /api/applications/search route', () => {
    let server

    beforeAll(async () => {
      server = await createServer()
    })

    beforeEach(async () => {
      jest.clearAllMocks()
    })

    const method = 'POST'
    const createdAt = new Date()
    const data = { organisation: { sbi: '1231' }, whichReview: 'sheep' }
    const reference = 'IAHW-U6ZE-5R5E'
    searchApplications.mockResolvedValue({
      applications: [
        {
          toJSON: () => ({
            reference,
            createdBy: 'admin',
            createdAt,
            data,
            flags: [
              {
                appliesToMh: true
              }
            ]
          })
        }
      ],
      total: 1
    })
    // TODO: These test cases are more appropriate at the respository layer as that is where the logic resides so
    // they need moving there, and here we should just be checking validation, and route response handling
    test.each([
      { search: { text: '444444444', type: 'sbi' } },
      { search: { text: 'AHWR-555A-FD6E', type: 'ref' } },
      { search: { text: 'applied', type: 'status' } },
      { search: { text: 'data inputted', type: 'status' } },
      { search: { text: 'claimed', type: 'status' } },
      { search: { text: 'check', type: 'status' } },
      { search: { text: 'accepted', type: 'status' } },
      { search: { text: 'rejected', type: 'status' } },
      { search: { text: 'paid', type: 'status' } },
      { search: { text: 'withdrawn', type: 'status' } },
      { search: { text: 'on hold', type: 'status' } }
    ])('returns success when post %p', async ({ search }) => {
      const options = {
        method,
        url: '/api/applications/search',
        payload: { search }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(searchApplications).toHaveBeenCalledTimes(1)
      expect(JSON.parse(res.payload)).toEqual({
        applications: [
          {
            createdAt: createdAt.toISOString(),
            createdBy: 'admin',
            data: {
              organisation: {
                sbi: '1231'
              },
              whichReview: 'sheep'
            },
            flags: [
              {
                appliesToMh: true
              }
            ],
            reference: 'IAHW-U6ZE-5R5E'
          }
        ],
        total: 1
      })
    })

    test.each([
      { search: { text: '333333333' } },
      { search: { text: '444444443' } },
      { search: { text: 'AHWR-555A-F5D5' } },
      { search: { text: '' } },
      { search: { text: undefined } }
    ])('returns success with error message when no data found', async ({ search }) => {
      searchApplications.mockReturnValue({
        applications: [],
        total: 0
      })

      const options = {
        method,
        url: '/api/applications/search',
        payload: { search }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(searchApplications).toHaveBeenCalledTimes(1)
      const $ = JSON.parse(res.payload)
      expect($.total).toBe(0)
    })

    test.each([
      { search: { text: '333333333' }, limit: 'abc', offset: 0 },
      { search: { text: '444444443' }, offset: 'abc', limit: 20 }
    ])('returns 400 with error message for invalid input', async ({ search, limit, offset }) => {
      const options = {
        method,
        url: '/api/applications/search',
        payload: { search, limit, offset }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PUT /api/applications/{ref}/eligible-pii-redaction', () => {
    const putRoute = applicationRoutes.find(
      (r) => r.method === 'PUT' && r.path === '/api/applications/{ref}/eligible-pii-redaction'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(putRoute.options.validate.failAction(mockRequest, null, mockError)).rejects.toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Update application eligiblePiiRedaction validation error'
        )
      })
    })
  })

  describe('PUT /api/applications/{reference}/data', () => {
    const putRoute = applicationRoutes.find(
      (r) => r.method === 'PUT' && r.path === '/api/applications/{reference}/data'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(putRoute.options.validate.failAction(mockRequest, null, mockError)).rejects.toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Update application data validation error'
        )
      })
    })
  })
})
