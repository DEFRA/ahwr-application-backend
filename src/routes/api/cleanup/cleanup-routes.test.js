import { cleanupHandlers } from './cleanup-routes.js'
import { cleanupController } from './cleanup-controller.js'

const cleanupHandler = cleanupHandlers[0]

describe('cleanupHandlers', () => {
  describe('on error', () => {
    it('calls logger and returns 400', async () => {
      const mockLogger = { setBindings: jest.fn() }
      const mockH = {
        response: jest.fn().mockReturnValue({
          code: jest.fn().mockReturnValue({
            takeover: jest.fn()
          })
        })
      }
      const mockError = new Error('validation error')
      const request = { logger: mockLogger }

      await cleanupHandler.options.validate.failAction(request, mockH, mockError)

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ error: mockError })
      expect(mockH.response).toHaveBeenCalledWith({ err: mockError })
    })
  })

  describe('handler', () => {
    it('is wired to cleanupController', () => {
      expect(cleanupHandler.options.handler).toBe(cleanupController)
    })
  })
})
