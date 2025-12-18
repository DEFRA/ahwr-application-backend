import { cleanupBySbi } from './cleanup-service.js'
import { deleteDataForSbis } from '../../../repositories/cleanup-repository.js'

jest.mock('../../../repositories/cleanup-repository.js', () => ({
  deleteDataForSbis: jest.fn()
}))

describe('cleanupBySbi', () => {
  let mockDb
  let mockLogger

  beforeEach(() => {
    mockDb = {}
    mockLogger = { info: jest.fn() }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('calls deleteDataForSbis with the correct arguments', async () => {
    const sbisToDelete = ['123', '456']
    deleteDataForSbis.mockResolvedValue({
      applicationsDeleted: 2,
      herdsDeleted: 5,
      claimsDeleted: 3
    })

    await cleanupBySbi(sbisToDelete, mockDb, mockLogger)

    expect(deleteDataForSbis).toHaveBeenCalledTimes(1)
    expect(deleteDataForSbis).toHaveBeenCalledWith(sbisToDelete, mockDb)
  })

  it('logs the correct info message', async () => {
    const sbisToDelete = ['123', '456']
    deleteDataForSbis.mockResolvedValue({
      applicationsDeleted: 2,
      herdsDeleted: 5,
      claimsDeleted: 3
    })

    await cleanupBySbi(sbisToDelete, mockDb, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Deleted 2 applications, 5 herds and 3 claims for 2 sbis provided.'
    )
  })

  it('propagates errors from deleteDataForSbis', async () => {
    const sbisToDelete = ['123']
    const error = new Error('DB failure')
    deleteDataForSbis.mockRejectedValueOnce(error)

    await expect(cleanupBySbi(sbisToDelete, mockDb, mockLogger)).rejects.toThrow('DB failure')
  })
})
