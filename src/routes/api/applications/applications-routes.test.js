import Boom from '@hapi/boom'
import { applicationRoutes } from './applications-routes.js'
import { searchApplications } from '../../../repositories/application-repository.js'
import { StatusCodes } from 'http-status-codes'
import { trackError } from '../../../logging/logger.js'

jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../logging/logger.js')

describe('applicationRoutes', () => {
  describe('POST /api/applications', () => {
    const postRoute = applicationRoutes.find(
      (r) => r.method === 'POST' && r.path === '/api/applications'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', async () => {
        const mockError = new Error('Validation failed')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        await expect(
          postRoute.options.validate.failAction(mockRequest, null, mockError)
        ).rejects.toEqual(Boom.badRequest(mockError))
        expect(trackError).toHaveBeenCalledWith(
          mockLogger,
          mockError,
          'failed-validation',
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
    const postRoute = applicationRoutes.find(
      (r) => r.method === 'POST' && r.path === '/api/applications/search'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', async () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        await expect(
          postRoute.options.validate.failAction(mockRequest, null, mockError)
        ).rejects.toThrow(Boom.badRequest(mockError.message))
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Application search validation error'
        )
      })
    })

    describe('Successful requests', () => {
      const mockH = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnThis()
      }

      beforeEach(() => {
        jest.clearAllMocks()
      })
      it('should return 200 and pass request through with all optional payload items', async () => {
        const mockResultSet = { applications: [{ applicationReference: '123456789' }], total: 1 }
        const mockDb = {}
        searchApplications.mockResolvedValueOnce(mockResultSet)

        const mockLogger = { error: jest.fn() }
        const mockRequest = {
          logger: mockLogger,
          db: mockDb,
          payload: {
            search: { text: 'search text', type: 'SEARCH_TYPE' },
            limit: 10,
            offset: 0,
            sort: { field: 'CREATEDAT', direction: 'ASC' }
          }
        }

        const res = await postRoute.options.handler(mockRequest, mockH)

        expect(mockH.response).toHaveBeenCalledWith(mockResultSet)
        expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
        expect(res).toBe(mockH)

        expect(searchApplications).toHaveBeenCalledWith(
          mockDb,
          {
            searchText: 'search text',
            searchType: 'SEARCH_TYPE',
            status: undefined,
            agreementType: undefined,
            dateFrom: undefined,
            dateTo: undefined
          },
          0,
          10,
          { field: 'CREATEDAT', direction: 'ASC' }
        )
      })

      it('should pass dateFrom and dateTo through when provided', async () => {
        const mockResultSet = { applications: [{ applicationReference: '123456789' }], total: 1 }
        const mockDb = {}
        searchApplications.mockResolvedValueOnce(mockResultSet)

        const dateFrom = new Date(2025, 0, 1)
        const dateTo = new Date(2025, 11, 31)
        const mockLogger = { error: jest.fn() }
        const mockRequest = {
          logger: mockLogger,
          db: mockDb,
          payload: {
            dateFrom,
            dateTo,
            limit: 10,
            offset: 0,
            filter: [],
            sort: { field: 'CREATEDAT', direction: 'ASC' }
          }
        }

        await postRoute.options.handler(mockRequest, mockH)

        expect(searchApplications).toHaveBeenCalledWith(
          mockDb,
          {
            searchText: '',
            searchType: undefined,
            agreementType: undefined,
            dateFrom,
            dateTo,
            status: undefined
          },
          0,
          10,
          { field: 'CREATEDAT', direction: 'ASC' }
        )
      })

      it('should pass agreementType through when provided', async () => {
        const mockResultSet = { applications: [{ applicationReference: '123456789' }], total: 1 }
        const mockDb = {}
        searchApplications.mockResolvedValueOnce(mockResultSet)

        const mockLogger = { error: jest.fn() }
        const mockRequest = {
          logger: mockLogger,
          db: mockDb,
          payload: {
            agreementType: 'PBR',
            limit: 10,
            offset: 0,
            sort: { field: 'CREATEDAT', direction: 'ASC' }
          }
        }

        await postRoute.options.handler(mockRequest, mockH)

        expect(searchApplications).toHaveBeenCalledWith(
          mockDb,
          {
            searchText: '',
            searchType: undefined,
            agreementType: 'PBR',
            dateFrom: undefined,
            dateTo: undefined,
            status: undefined
          },
          0,
          10,
          { field: 'CREATEDAT', direction: 'ASC' }
        )
      })

      it('should pass flag through when provided', async () => {
        const mockResultSet = { applications: [{ applicationReference: '123456789' }], total: 1 }
        const mockDb = {}
        searchApplications.mockResolvedValueOnce(mockResultSet)

        const mockLogger = { error: jest.fn() }
        const mockRequest = {
          logger: mockLogger,
          db: mockDb,
          payload: {
            flag: 'FLAGGED',
            limit: 10,
            offset: 0,
            sort: { field: 'CREATEDAT', direction: 'ASC' }
          }
        }

        await postRoute.options.handler(mockRequest, mockH)

        expect(searchApplications).toHaveBeenCalledWith(
          mockDb,
          {
            searchText: '',
            searchType: undefined,
            flag: 'FLAGGED'
          },
          0,
          10,
          { field: 'CREATEDAT', direction: 'ASC' }
        )
      })

      it('should pass status through when provided', async () => {
        const mockResultSet = { applications: [{ applicationReference: '123456789' }], total: 1 }
        const mockDb = {}
        searchApplications.mockResolvedValueOnce(mockResultSet)

        const mockLogger = { error: jest.fn() }
        const mockRequest = {
          logger: mockLogger,
          db: mockDb,
          payload: {
            status: 'AGREED',
            limit: 10,
            offset: 0,
            sort: { field: 'CREATEDAT', direction: 'ASC' }
          }
        }

        await postRoute.options.handler(mockRequest, mockH)

        expect(searchApplications).toHaveBeenCalledWith(
          mockDb,
          {
            searchText: '',
            searchType: undefined,
            status: 'AGREED'
          },
          0,
          10,
          { field: 'CREATEDAT', direction: 'ASC' }
        )
      })

      it('should return 200 and pass request through with no optional payload items', async () => {
        const mockResultSet = { applications: [{ applicationReference: '123456789' }], total: 1 }
        const mockDb = {}
        searchApplications.mockResolvedValueOnce(mockResultSet)

        const mockLogger = { error: jest.fn() }
        const mockRequest = {
          logger: mockLogger,
          db: mockDb,
          payload: {
            limit: 0,
            offset: 0,
            sort: { field: 'CREATEDAT', direction: 'ASC' }
          }
        }

        const res = await postRoute.options.handler(mockRequest, mockH)

        expect(mockH.response).toHaveBeenCalledWith(mockResultSet)
        expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
        expect(res).toBe(mockH)

        expect(searchApplications).toHaveBeenCalledWith(
          mockDb,
          {
            searchText: '',
            searchType: undefined,
            agreementType: undefined,
            dateFrom: undefined,
            dateTo: undefined,
            status: undefined
          },
          0,
          0,
          { field: 'CREATEDAT', direction: 'ASC' }
        )
      })
    })
  })

  describe('PUT /api/applications/{ref}/eligible-pii-redaction', () => {
    const putRoute = applicationRoutes.find(
      (r) => r.method === 'PUT' && r.path === '/api/applications/{ref}/eligible-pii-redaction'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', async () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        await expect(
          putRoute.options.validate.failAction(mockRequest, null, mockError)
        ).rejects.toThrow(Boom.badRequest(mockError.message))
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
      it('should return 400 and log the error when validation fails', async () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        await expect(
          putRoute.options.validate.failAction(mockRequest, null, mockError)
        ).rejects.toThrow(Boom.badRequest(mockError.message))
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Update application data validation error'
        )
      })
    })
  })
})
