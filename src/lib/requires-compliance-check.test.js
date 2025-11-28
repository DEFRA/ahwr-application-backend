import { generateClaimStatus } from './requires-compliance-check'
import { getAndIncrementComplianceCheckCount } from '../repositories/compliance-check-count'
import { config } from '../config/config.js'
import { applicationStatus } from '../constants'

jest.mock('../repositories/compliance-check-count')
jest.mock('../config/config.js', () => ({
  config: {
    get: jest.fn()
  }
}))

const mockLogger = { info: jest.fn(), warn: jest.fn() }
const mockDb = jest.fn()

const mockConfig = ({
  complianceCheckRatio = 5,
  featureAssurance = { enabled: true, startDate: new Date('2025-06-01') }
}) => {
  config.get.mockImplementation((field) => {
    if (field === 'complianceCheckRatio') {
      return complianceCheckRatio
    }
    if (field === 'featureAssurance') {
      return featureAssurance
    }
  })
}

describe('generateClaimStatus', () => {
  afterEach(() => jest.clearAllMocks())

  test('should return inCheck when compliance checks are enabled and ratio matches', async () => {
    mockConfig({ complianceCheckRatio: 1 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(5)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(getAndIncrementComplianceCheckCount).toHaveBeenCalledTimes(1)
    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when compliance checks are disabled (ratio <= 0)', async () => {
    mockConfig({ complianceCheckRatio: 0 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(10)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.onHold)
    expect(getAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when compliance checks are disabled (negative ratio)', async () => {
    mockConfig({ complianceCheckRatio: -1 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(5)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.onHold)
    expect(getAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when claim count does not match ratio interval', async () => {
    mockConfig({ complianceCheckRatio: 5 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(6)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when claim count matches ratio interval', async () => {
    mockConfig({ complianceCheckRatio: 3 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(3)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return inCheck when claim count is multiple of ratio', async () => {
    mockConfig({ complianceCheckRatio: 5 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(10)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when claim count is not multiple of ratio', async () => {
    mockConfig({ complianceCheckRatio: 3 })
    getAndIncrementComplianceCheckCount.mockResolvedValue(4)
    const visitDate = '2025-06-01'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance on but visit date before assurance start', async () => {
    mockConfig({
      complianceCheckRatio: 5,
      featureAssurance: { enabled: true, startDate: '2025-06-26' }
    })
    getAndIncrementComplianceCheckCount.mockResolvedValue(4)
    const visitDate = '2025-06-25'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when visit date after assurance start but feature assurance off', async () => {
    mockConfig({
      complianceCheckRatio: 5,
      featureAssurance: { enabled: false, startDate: '2025-06-26' }
    })
    getAndIncrementComplianceCheckCount.mockResolvedValue(4)
    const visitDate = '2025-06-27'

    const result = await generateClaimStatus(visitDate, mockLogger, mockDb)

    expect(result).toBe(applicationStatus.onHold)
  })
})
