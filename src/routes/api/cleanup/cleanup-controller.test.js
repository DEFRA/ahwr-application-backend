import { cleanupController } from './cleanup-controller.js'
import { cleanupBySbi } from './cleanup-service.js'
import { StatusCodes } from 'http-status-codes'

jest.mock('./cleanup-service.js', () => ({
  cleanupBySbi: jest.fn()
}))

describe('cleanupController', () => {
  let mockRequest
  let mockH
  const mockCodeFn = jest.fn().mockReturnValue('Pretend response')

  beforeEach(() => {
    mockRequest = {
      query: { sbi: ['123456789', '987654321'] },
      db: {},
      logger: { info: jest.fn(), error: jest.fn() }
    }

    mockH = {
      response: jest.fn().mockReturnValue({
        code: mockCodeFn
      })
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('calls cleanupBySbi with the correct parameters', async () => {
    await cleanupController(mockRequest, mockH)

    expect(cleanupBySbi).toHaveBeenCalledTimes(1)
    expect(cleanupBySbi).toHaveBeenCalledWith(
      mockRequest.query.sbi,
      mockRequest.db,
      mockRequest.logger
    )
  })

  it('returns 204 No Content', async () => {
    const response = await cleanupController(mockRequest, mockH)
    expect(mockCodeFn).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
    expect(response).toBe('Pretend response')
  })

  it('throws if cleanupBySbi throws', async () => {
    cleanupBySbi.mockRejectedValueOnce(new Error('DB failure'))

    await expect(cleanupController(mockRequest, mockH)).rejects.toThrow('DB failure')
  })
})
