import { processClaim } from './claims-service.js'
import { getApplication } from '../../../repositories/application-repository.js'
import { isURNNumberUnique } from '../../../repositories/claim-repository.js'
import { createClaimReference } from '../../../lib/create-reference.js'
import { validateClaim } from '../../../processing/claim/validation.js'
import { saveClaimAndRelatedData } from '../../../processing/claim/ahwr/processor.js'
import { AHWR_SCHEME } from 'ffc-ahwr-common-library'

jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../lib/create-reference.js')
jest.mock('../../../processing/claim/validation.js')
jest.mock('../../../processing/claim/ahwr/processor.js')
jest.mock('@hapi/boom', () => ({
  notFound: jest.fn((msg) => new Error(`NotFound: ${msg}`)),
  badRequest: jest.fn((msg) => new Error(`BadRequest: ${JSON.stringify(msg)}`))
}))

describe('processClaim', () => {
  const mockLogger = { setBindings: jest.fn() }
  const mockDb = {}
  const payload = {
    applicationReference: 'IAHW-AAAA-AAAA',
    type: 'R',
    reference: 'TEMP-O9UD-0025',
    data: {
      typeOfLivestock: 'beef',
      laboratoryURN: 'AK-2024-38'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates and returns claim when valid request', async () => {
    const saveClaimResult = {
      claim: {
        applicationReference: 'IAHW-AAAA-AAAA',
        reference: 'RESH-O9UD-0025',
        data: {
          typeOfLivestock: 'sheep',
          dateOfVisit: '2025-10-20T00:00:00.000Z',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          vetsName: 'Jane Doe',
          vetRCVSNumber: 'AK-2024',
          laboratoryURN: 'AK-2024-38',
          numberAnimalsTested: 30,
          speciesNumbers: 'yes',
          amount: 4,
          claimType: 'R'
        },
        type: 'REVIEW',
        createdBy: 'admin',
        status: 'ON_HOLD',
        herd: {
          id: 'db32152a-724a-4c5d-8073-0901c8d307f7',
          version: 1,
          cph: '12/345/6789',
          name: 'Sheep herd 2',
          reasons: ['uniqueHealthNeeds'],
          associatedAt: '2025-10-21T09:28:49.760Z'
        }
      }
    }
    getApplication.mockResolvedValue({
      flags: [],
      organisation: { sbi: '123456789' }
    })
    validateClaim.mockReturnValue({})
    createClaimReference.mockReturnValue('RESH-O9UD-0025')
    isURNNumberUnique.mockResolvedValue({ isURNUnique: true })
    saveClaimAndRelatedData.mockResolvedValue(saveClaimResult)

    const result = await processClaim({
      payload,
      logger: mockLogger,
      db: mockDb
    })

    expect(result).toEqual(saveClaimResult.claim)
    expect(createClaimReference).toHaveBeenCalledWith(
      'TEMP-O9UD-0025',
      'R',
      'beef'
    )
    expect(saveClaimAndRelatedData).toHaveBeenCalledWith({
      db: mockDb,
      sbi: '123456789',
      payload,
      claimReference: 'RESH-O9UD-0025',
      flags: [],
      logger: mockLogger
    })
  })

  test('throws NotFound error when application does not exist', async () => {
    getApplication.mockResolvedValue(null)

    await expect(
      processClaim({ payload, logger: mockLogger, db: mockDb })
    ).rejects.toThrow('NotFound')

    expect(getApplication).toHaveBeenCalledWith(mockDb, 'IAHW-AAAA-AAAA')
  })

  test('throws BadRequest when request is invalid', async () => {
    getApplication.mockResolvedValue({
      flags: [],
      organisation: { sbi: '123456789' }
    })
    validateClaim.mockReturnValue({ error: new Error('Invalid claim') })

    await expect(
      processClaim({ payload, logger: mockLogger, db: mockDb })
    ).rejects.toThrow('BadRequest')

    expect(validateClaim).toHaveBeenCalledWith(AHWR_SCHEME, payload, [])
  })

  test('throws BadRequest when URN number is not unique', async () => {
    getApplication.mockResolvedValue({
      flags: [],
      organisation: { sbi: '123456789' }
    })
    validateClaim.mockReturnValue({})
    createClaimReference.mockReturnValue('RESH-O9UD-0025')
    isURNNumberUnique.mockResolvedValue({ isURNUnique: false })

    await expect(
      processClaim({ payload, logger: mockLogger, db: mockDb })
    ).rejects.toThrow('BadRequest')

    expect(isURNNumberUnique).toHaveBeenCalledWith({
      db: mockDb,
      sbi: '123456789',
      laboratoryURN: 'AK-2024-38'
    })
  })

  test('throws error when claim was not created', async () => {
    getApplication.mockResolvedValue({
      flags: [],
      organisation: { sbi: '123456789' }
    })
    validateClaim.mockReturnValue({})
    createClaimReference.mockReturnValue('RESH-O9UD-0025')
    isURNNumberUnique.mockResolvedValue({ isURNUnique: true })
    saveClaimAndRelatedData.mockResolvedValue({ claim: null })

    await expect(
      processClaim({ payload, logger: mockLogger, db: mockDb })
    ).rejects.toThrow('Claim was not created')
  })
})
