import Boom from '@hapi/boom'
import { flagHandlers } from './flags-routes.js'

describe('flagHandlers', () => {
  describe('POST /api/applications/{ref}/flag', () => {
    const postRoute = flagHandlers.find(
      (r) => r.method === 'POST' && r.path === '/api/applications/{ref}/flag'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Validation failed')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() => postRoute.options.validate.failAction(mockRequest, null, mockError)).toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          {
            error: { message: 'Validation failed', stack: expect.any(String) }
          },
          'Create flag validation error'
        )
      })
    })
  })

  describe('PATCH /api/flags/{flagId}/delete', () => {
    const patchRoute = flagHandlers.find(
      (r) => r.method === 'PATCH' && r.path === '/api/flags/{flagId}/delete'
    )

    describe('failAction', () => {
      it('should return 400 and log the error when validation fails', () => {
        const mockError = new Error('Invalid query')
        const mockLogger = { error: jest.fn() }
        const mockRequest = { logger: mockLogger }

        expect(() => patchRoute.options.validate.failAction(mockRequest, null, mockError)).toThrow(
          Boom.badRequest(mockError.message)
        )
        expect(mockLogger.error).toHaveBeenCalledWith(
          {
            error: { message: 'Invalid query', stack: expect.any(String) }
          },
          'Delete flag validation error'
        )
      })
    })
  })
})
