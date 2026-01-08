import { redactClaimPII } from '../repositories/claim-repository.js'
import { redactContactHistoryPII } from '../repositories/contact-history-repository.js'
import { redactFlagPII } from '../repositories/flag-repository.js'
import { redactHerdPII } from '../repositories/herd-repository.js'
import { redactApplicationPII } from '../repositories/application-repository.js'
import { redactApplicationDatabasePII } from '../redact-pii/redact-pii-application-database'
import { updateApplicationRedactRecords } from '../redact-pii/update-application-redact-records'

jest.mock('../repositories/claim-repository.js')
jest.mock('../repositories/contact-history-repository.js')
jest.mock('../repositories/flag-repository.js')
jest.mock('../repositories/herd-repository.js')
jest.mock('../repositories/application-repository.js')
jest.mock('../redact-pii/update-application-redact-records.js')

describe('redact-pii-application-database', () => {
  let mockLogger

  beforeEach(() => {
    jest.clearAllMocks()

    mockLogger = {
      info: jest.fn(),
      setBindings: jest.fn()
    }

    redactClaimPII.mockResolvedValue()
    redactContactHistoryPII.mockResolvedValue()
    redactFlagPII.mockResolvedValue()
    redactHerdPII.mockResolvedValue()
    redactApplicationPII.mockResolvedValue()
    updateApplicationRedactRecords.mockResolvedValue()
  })

  it('should call all redact functions for each agreement and log success', async () => {
    const agreements = [{ reference: 'AG-001' }, { reference: 'AG-002' }]

    await redactApplicationDatabasePII(agreements, 'progressId', mockLogger)

    expect(redactHerdPII).toHaveBeenCalledTimes(2)
    expect(redactFlagPII).toHaveBeenCalledTimes(2)
    expect(redactContactHistoryPII).toHaveBeenCalledTimes(2)
    expect(redactClaimPII).toHaveBeenCalledTimes(2)
    expect(redactApplicationPII).toHaveBeenCalledTimes(2)

    agreements.forEach(({ reference }) => {
      expect(redactHerdPII).toHaveBeenCalledWith(reference)
      expect(redactFlagPII).toHaveBeenCalledWith(reference)
      expect(redactContactHistoryPII).toHaveBeenCalledWith(reference, mockLogger)
      expect(redactClaimPII).toHaveBeenCalledWith(reference, mockLogger)
      expect(redactApplicationPII).toHaveBeenCalledWith(reference, mockLogger)
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      `applicationDatabaseRedactPII with: ${JSON.stringify(agreements)}`
    )
  })

  it('should handle errors, call updateApplicationRedactRecords, and rethrow error', async () => {
    const agreements = [{ reference: 'AG-003' }]
    const testError = new Error('Redaction failed')

    redactFlagPII.mockRejectedValueOnce(testError)

    await expect(
      redactApplicationDatabasePII(agreements, 'progressId', mockLogger)
    ).rejects.toThrow('Redaction failed')

    expect(mockLogger.setBindings).toHaveBeenCalledWith({ error: testError })
    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(agreements, true, 'progressId', 'N')
  })
})
