import { ValidationError } from 'joi'
import { processClaim, isURNNumberUnique, getClaim } from './claims-service.js'
import {
  getApplication,
  getApplicationsBySbi
} from '../../../repositories/application-repository.js'
import { isOWURNUnique } from '../../../repositories/ow-application-repository.js'
import {
  isURNUnique as isNWURNUnique,
  getClaimByReference
} from '../../../repositories/claim-repository.js'
import * as createReference from '../../../lib/create-reference.js'
import {
  saveClaimAndRelatedData,
  generateEventsAndComms
} from '../../../processing/claim/ahwr/processor.js'
import { trackError } from '../../../logging/logger.js'

jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../repositories/ow-application-repository.js')
jest.mock('../../../processing/claim/ahwr/processor.js')
jest.mock('../../../logging/logger.js')
jest.mock('@hapi/boom', () => ({
  notFound: jest.fn((msg) => new Error(`NotFound: ${msg}`)),
  badRequest: jest.fn((msg) => new Error(`BadRequest: ${JSON.stringify(msg)}`))
}))

describe('processClaim', () => {
  describe('poultry claim', () => {
    const mockLogger = { setBindings: jest.fn(), error: jest.fn() }
    const mockDb = {}
    const payload = {
      applicationReference: 'POUL-AAAA-AAAA',
      type: 'REVIEW',
      reference: 'TEMP-CLAIM-O9UD-0025',
      createdBy: '2025-12-30T12:00:00Z',
      data: {
        typeOfLivestock: 'broilers',
        dateOfVisit: new Date('2025-12-30T12:00:00Z'),
        speciesNumbers: 'yes',
        vetsName: 'vet name',
        vetRCVSNumber: '2323232',
        assuranceScheme: 'yes',
        biosecurity: 'yes',
        herd: {
          id: 'db32152a-724a-4c5d-8073-0901c8d307f7',
          version: 2,
          name: 'Poultry Unit',
          cph: '22/222/2222',
          reasons: [],
          same: 'no'
        }
      }
    }

    beforeEach(() => {
      jest.spyOn(createReference, 'createClaimReference')
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    test('creates and returns claim when valid request', async () => {
      const herdData = {
        id: 'db32152a-724a-4c5d-8073-0901c8d307f7',
        version: 1,
        cph: '12/345/6789',
        name: 'Broilers 2',
        associatedAt: '2025-10-21T09:28:49.760Z'
      }
      const saveClaimResult = {
        claim: {
          applicationReference: 'POUL-AAAA-AAAA',
          reference: 'POBR-O9UD-0025',
          data: {
            typeOfLivestock: 'broilers',
            dateOfVisit: '2025-10-20T00:00:00.000Z',
            dateOfTesting: '2024-01-22T00:00:00.000Z',
            vetsName: 'Jane Doe',
            vetRCVSNumber: 'AK-2024',
            laboratoryURN: 'AK-2024-38',
            numberAnimalsTested: 30,
            speciesNumbers: 'yes',
            amount: 4,
            claimType: 'REVIEW'
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
        },
        isMultiHerdsClaim: true,
        herdGotUpdated: true,
        herdData
      }
      const application = {
        flags: [],
        organisation: { sbi: '123456789' }
      }
      getApplication.mockResolvedValue(application)
      saveClaimAndRelatedData.mockResolvedValue(saveClaimResult)

      const result = await processClaim({
        payload,
        logger: mockLogger,
        db: mockDb
      })

      expect(result).toEqual(saveClaimResult.claim)
      expect(createReference.createClaimReference).toHaveBeenCalledWith(
        'TEMP-CLAIM-O9UD-0025',
        'REVIEW',
        'broilers',
        true
      )
      expect(saveClaimAndRelatedData).toHaveBeenCalledWith({
        db: mockDb,
        sbi: '123456789',
        claimPayload: payload,
        claimReference: 'POBR-O9UD-0025',
        flags: [],
        logger: mockLogger
      })
      expect(generateEventsAndComms).toHaveBeenCalledWith(
        true,
        saveClaimResult.claim,
        application,
        herdData,
        true,
        'db32152a-724a-4c5d-8073-0901c8d307f7'
      )
    })
  })

  describe('standard herd claim', () => {
    const mockLogger = { setBindings: jest.fn(), error: jest.fn() }
    const mockDb = {}
    const payload = {
      applicationReference: 'IAHW-AAAA-AAAA',
      type: 'REVIEW',
      reference: 'TEMP-CLAIM-O9UD-0025',
      createdBy: '2025-12-30T12:00:00Z',
      data: {
        typeOfLivestock: 'beef',
        dateOfVisit: new Date('2025-12-30T12:00:00Z'),
        dateOfTesting: new Date('2025-12-30T12:00:00Z'),
        vetsName: 'vet name',
        vetRCVSNumber: '2323232',
        speciesNumbers: 'yes',
        laboratoryURN: 'AK-2024-38',
        testResults: 'negative',
        numberAnimalsTested: 5,
        herd: {
          id: 'db32152a-724a-4c5d-8073-0901c8d307f7',
          version: 2,
          name: 'Beef Herd',
          cph: '22/222/2222',
          reasons: [],
          same: 'no'
        }
      }
    }

    const wrongPayload = {
      applicationReference: 'IAHW-AAAA-AAAA',
      type: 'REVIEW',
      reference: 'TEMP-CLAIM-O9UD-0025',
      createdBy: '2025-12-30T12:00:00Z',
      data: {
        typeOfLivestock: 'beef',
        dateOfTesting: new Date('2025-12-30T12:00:00Z'),
        vetsName: 'vet name',
        vetRCVSNumber: '2323232',
        speciesNumbers: 'yes',
        laboratoryURN: 'AK-2024-38',
        testResults: 'negative',
        numberAnimalsTested: 5,
        herd: {
          id: 'db32152a-724a-4c5d-8073-0901c8d307f7',
          version: 2,
          name: 'Beef Herd',
          cph: '22/222/2222',
          reasons: [],
          same: 'no'
        }
      }
    }

    beforeEach(() => {
      jest.spyOn(createReference, 'createClaimReference')
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    const mockIsURNNumberUnique = (unique) => {
      getApplicationsBySbi.mockResolvedValue([{ reference: 'IAHW-7NF8-3KB9' }])
      isNWURNUnique.mockResolvedValue(unique)
      isOWURNUnique.mockResolvedValue(true)
    }

    test('creates and returns claim when valid request', async () => {
      const herdData = {
        id: 'db32152a-724a-4c5d-8073-0901c8d307f7',
        version: 1,
        cph: '12/345/6789',
        name: 'Sheep herd 2',
        reasons: ['uniqueHealthNeeds'],
        associatedAt: '2025-10-21T09:28:49.760Z'
      }
      const saveClaimResult = {
        claim: {
          applicationReference: 'IAHW-AAAA-AAAA',
          reference: 'REBC-O9UD-0025',
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
            claimType: 'REVIEW'
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
        },
        isMultiHerdsClaim: true,
        herdGotUpdated: true,
        herdData
      }
      const application = {
        flags: [],
        organisation: { sbi: '123456789' }
      }
      getApplication.mockResolvedValue(application)
      mockIsURNNumberUnique(true)
      saveClaimAndRelatedData.mockResolvedValue(saveClaimResult)

      const result = await processClaim({
        payload,
        logger: mockLogger,
        db: mockDb
      })

      expect(result).toEqual(saveClaimResult.claim)
      expect(createReference.createClaimReference).toHaveBeenCalledWith(
        'TEMP-CLAIM-O9UD-0025',
        'REVIEW',
        'beef',
        false
      )
      expect(saveClaimAndRelatedData).toHaveBeenCalledWith({
        db: mockDb,
        sbi: '123456789',
        claimPayload: payload,
        claimReference: 'REBC-O9UD-0025',
        flags: [],
        logger: mockLogger
      })
      expect(generateEventsAndComms).toHaveBeenCalledWith(
        true,
        saveClaimResult.claim,
        application,
        herdData,
        true,
        'db32152a-724a-4c5d-8073-0901c8d307f7'
      )
    })

    test('throws NotFound error when application does not exist', async () => {
      getApplication.mockResolvedValue(null)

      await expect(processClaim({ payload, logger: mockLogger, db: mockDb })).rejects.toThrow(
        'NotFound'
      )

      expect(getApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'IAHW-AAAA-AAAA'
      })
    })

    test('throws BadRequest when request is invalid', async () => {
      getApplication.mockResolvedValue({
        flags: [],
        organisation: { sbi: '123456789' }
      })

      await expect(
        processClaim({ payload: wrongPayload, logger: mockLogger, db: mockDb })
      ).rejects.toThrow('BadRequest')

      const validationError = new ValidationError(
        '"data.dateOfVisit" is required',
        ['data.dateOfVisit'],
        ''
      )
      expect(trackError).toHaveBeenCalledWith(
        mockLogger,
        validationError,
        'failed-validation',
        'Create claim validation error'
      )
    })

    test('throws BadRequest when URN number is not unique', async () => {
      getApplication.mockResolvedValue({
        flags: [],
        organisation: { sbi: '123456789' }
      })
      mockIsURNNumberUnique(false)

      await expect(processClaim({ payload, logger: mockLogger, db: mockDb })).rejects.toThrow(
        'BadRequest'
      )

      expect(isNWURNUnique).toHaveBeenCalledWith({
        db: mockDb,
        laboratoryURN: 'AK-2024-38',
        applicationReferences: ['IAHW-7NF8-3KB9']
      })
      expect(isOWURNUnique).toHaveBeenCalledWith({
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
      mockIsURNNumberUnique(true)
      saveClaimAndRelatedData.mockResolvedValue({ claim: null })

      await expect(processClaim({ payload, logger: mockLogger, db: mockDb })).rejects.toThrow(
        'Claim was not created'
      )
    })
  })
})

describe('isURNNumberUnique', () => {
  const db = {}
  const sbi = '123456789'
  const laboratoryURN = '3552981'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true when URN does not exist in NW and OW claims', async () => {
    getApplicationsBySbi.mockResolvedValue([
      { reference: 'IAHW-7NF8-3KB9' },
      { reference: 'IAHW-G7B4-UTZ5' }
    ])
    isNWURNUnique.mockResolvedValue(true)
    isOWURNUnique.mockResolvedValue(true)

    const result = await isURNNumberUnique({ db, sbi, laboratoryURN })

    expect(getApplicationsBySbi).toHaveBeenCalledWith(db, sbi)
    expect(isNWURNUnique).toHaveBeenCalledWith({
      db,
      applicationReferences: ['IAHW-7NF8-3KB9', 'IAHW-G7B4-UTZ5'],
      laboratoryURN
    })
    expect(isOWURNUnique).toHaveBeenCalledWith({
      db,
      sbi,
      laboratoryURN
    })
    expect(result).toEqual({ isURNUnique: true })
  })

  it('returns false when URN exists in either NW and OW claims ', async () => {
    getApplicationsBySbi.mockResolvedValue([
      { reference: 'IAHW-7NF8-3KB9' },
      { reference: 'IAHW-G7B4-UTZ5' }
    ])
    isNWURNUnique.mockResolvedValue(false)
    isOWURNUnique.mockResolvedValue(true)

    const result = await isURNNumberUnique({ db, sbi, laboratoryURN })

    expect(result).toEqual({ isURNUnique: false })
  })
})

describe('getClaim', () => {
  const db = {}

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns claim when claim exists for reference', async () => {
    getClaimByReference.mockResolvedValue({
      reference: 'FUBC-JTTU-SDQ7',
      applicationReference: 'IAHW-G3CL-V59P',
      createdAt: new Date('2025-08-15T09:00:53.000Z'),
      updatedAt: new Date('2025-08-15T09:00:53.000Z'),
      createdBy: 'admin',
      updatedBy: null,
      type: 'FOLLOW_UP',
      data: {
        amount: 837,
        piHunt: 'yes',
        vetsName: 'frrrr',
        claimType: 'E',
        biosecurity: 'yes',
        dateOfVisit: new Date('2025-08-15T00:00:00.000Z'),
        testResults: 'negative',
        dateOfTesting: new Date('2025-08-15T00:00:00.000Z'),
        laboratoryURN: 'URN34567ddd',
        vetRCVSNumber: '1234567',
        speciesNumbers: 'yes',
        typeOfLivestock: 'beef',
        piHuntAllAnimals: 'yes',
        piHuntRecommended: 'yes',
        reviewTestResults: 'negative'
      },
      status: 'IN_CHECK',
      statusHistory: [],
      herd: {
        id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
        cph: '12/345/6789',
        name: 'EventTester',
        reasons: ['uniqueHealthNeeds'],
        version: 2,
        associatedAt: new Date('2025-08-15T09:00:53.420Z')
      },
      updateHistory: []
    })

    const result = await getClaim({ db, reference: 'FUBC-JTTU-SDQ7' })

    expect(getClaimByReference).toHaveBeenCalledWith(db, 'FUBC-JTTU-SDQ7')
    expect(result).toEqual({
      reference: 'FUBC-JTTU-SDQ7',
      applicationReference: 'IAHW-G3CL-V59P',
      createdAt: new Date('2025-08-15T09:00:53.000Z'),
      type: 'FOLLOW_UP',
      data: {
        amount: 837,
        piHunt: 'yes',
        vetsName: 'frrrr',
        claimType: 'E',
        biosecurity: 'yes',
        dateOfVisit: new Date('2025-08-15T00:00:00.000Z'),
        testResults: 'negative',
        dateOfTesting: new Date('2025-08-15T00:00:00.000Z'),
        laboratoryURN: 'URN34567ddd',
        vetRCVSNumber: '1234567',
        speciesNumbers: 'yes',
        typeOfLivestock: 'beef',
        piHuntAllAnimals: 'yes',
        piHuntRecommended: 'yes',
        reviewTestResults: 'negative'
      },
      status: 'IN_CHECK',
      statusHistory: [],
      herd: {
        id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
        cph: '12/345/6789',
        name: 'EventTester',
        reasons: ['uniqueHealthNeeds'],
        version: 2,
        associatedAt: new Date('2025-08-15T09:00:53.420Z')
      },
      updateHistory: []
    })
  })

  it('returns not found error when claim does not exist for reference ', async () => {
    getClaimByReference.mockResolvedValue(null)

    await expect(getClaim({ db, reference: 'FUBC-JTTU-SDQ7' })).rejects.toThrow('Claim not found')
  })
})
