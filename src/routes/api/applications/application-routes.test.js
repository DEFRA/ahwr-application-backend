import Boom from '@hapi/boom'
import { applicationRoutes } from './application-routes.js'

describe('applicationRoutes', () => {
  describe('POST /api/applications', () => {
    const postRoute = applicationRoutes.find(
      (r) => r.method === 'POST' && r.path === '/api/applications'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Validation failed')
        const mockLogger = { error: vi.fn() }
        const mockRequest = { logger: mockLogger }

        expect(
          postRoute.options.validate.failAction(mockRequest, null, mockError)
        ).rejects.toEqual(Boom.badRequest(mockError))
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
        const mockLogger = { error: vi.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() =>
          getRoute.options.validate.failAction(mockRequest, null, mockError)
        ).toThrow(Boom.badRequest(mockError.message))
        expect(mockLogger.error).toHaveBeenCalledWith(
          mockError,
          'Get application validation error'
        )
      })
    })
  })
})
