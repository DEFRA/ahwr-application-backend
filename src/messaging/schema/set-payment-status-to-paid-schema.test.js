import { validateClaimStatusToPaidEvent } from './set-payment-status-to-paid-schema'

describe('validateRedactPIISchema', () => {
  let logger

  beforeEach(() => {
    logger = { error: jest.fn(), info: jest.fn() }
    jest.clearAllMocks()
  })

  it('returns true for a valid event', () => {
    const event = { claimRef: 'FUBC-JTTU-SDQ7', sbi: '123456789' }

    const result = validateClaimStatusToPaidEvent(event, logger)

    expect(result).toBe(true)
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('returns false when claimRef is missing', () => {
    const event = { claimRef: 'FUBC-JTTU-SDQ7' }

    const result = validateClaimStatusToPaidEvent(event, logger)

    expect(result).toBe(false)
    expect(logger.info).toHaveBeenCalled()
  })

  it('returns false when sbi is missing', () => {
    const event = { sbi: '123456789' }

    const result = validateClaimStatusToPaidEvent(event, logger)

    expect(result).toBe(false)
    expect(logger.info).toHaveBeenCalled()
  })
})
