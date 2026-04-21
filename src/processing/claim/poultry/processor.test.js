import { savePoultryClaimAndRelatedData, generatePoultryEventsAndComms } from './processor.js'
import { createClaim } from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { processSite } from './site-processor.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
import { getLogger } from '../../../logging/logger.js'
import { publishStatusChangeEvent } from '../../../messaging/publish-outbound-notification.js'

jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../lib/requires-compliance-check.js')
jest.mock('./site-processor.js')
jest.mock('../../../event-publisher/index.js')
jest.mock('../../../lib/emit-herd-MI-events.js')
jest.mock('../../../logging/logger.js')
jest.mock('../../../messaging/publish-outbound-notification.js')

const mockSession = {
  withTransaction: jest.fn((fn) => fn()),
  endSession: jest.fn()
}
const mockDb = { client: { startSession: jest.fn(() => mockSession) } }

const logger = { info: jest.fn(), error: jest.fn() }

describe('savePoultryClaimAndRelatedData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should save claim and site', async () => {
    const claimPayload = {
      applicationReference: 'POUL-8ZPZ-8CLI',
      data: {
        typesOfPoultry: ['broilers', 'ducks'],
        dateOfReview: '2025-01-01T00:00:00Z',
        minimumNumberOfBirds: 'yes',
        vetsName: 'Dr Smith',
        vetRCVSNumber: '1234567',
        biosecurity: 'yes',
        biosecurityUsefulness: 'very-useful',
        changesInBiosecurity: 'bird-handling',
        costOfChanges: 'over-4500',
        interview: 'no',
        site: {
          cph: '81/445/6789',
          id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
          name: 'Broilers Unit',
          version: 1
        }
      },
      createdBy: 'admin',
      type: 'REVIEW'
    }

    processSite.mockResolvedValue({
      claimSiteData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        name: 'Broilers Unit',
        version: 1,
        associatedAt: '2025-10-20T00:00:00.000Z',
        cph: '81/445/6789'
      },
      siteData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        applicationReference: 'POUL-8ZPZ-8CLI',
        species: 'poultry',
        name: 'Broilers Unit',
        cph: '81/445/6789',
        createdBy: 'admin',
        isCurrent: true
      },
      updated: true
    })
    generateClaimStatus.mockResolvedValue('ON_HOLD')
    createClaim.mockResolvedValue({
      insertedId: '6916f837292fe87d2bac0d5c'
    })

    const result = await savePoultryClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      claimPayload,
      claimReference: 'PORE-O9UD-0025',
      logger
    })

    expect(processSite).toHaveBeenCalledWith({
      site: claimPayload.data.site,
      applicationReference: 'POUL-8ZPZ-8CLI',
      createdBy: 'admin',
      db: mockDb,
      species: ['broilers', 'ducks']
    })

    const expectedClaim = {
      applicationReference: 'POUL-8ZPZ-8CLI',
      createdAt: expect.any(Date),
      createdBy: 'admin',
      data: {
        typesOfPoultry: ['broilers', 'ducks'],
        dateOfReview: '2025-01-01T00:00:00Z',
        minimumNumberOfBirds: 'yes',
        vetsName: 'Dr Smith',
        vetRCVSNumber: '1234567',
        biosecurity: 'yes',
        biosecurityUsefulness: 'very-useful',
        changesInBiosecurity: 'bird-handling',
        costOfChanges: 'over-4500',
        interview: 'no',
        amount: 430,
        claimType: 'REVIEW'
      },
      herd: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        name: 'Broilers Unit',
        version: 1,
        associatedAt: '2025-10-20T00:00:00.000Z',
        cph: '81/445/6789'
      },
      statusHistory: [
        {
          status: 'ON_HOLD',
          createdBy: 'admin',
          createdAt: expect.any(Date)
        }
      ],
      updateHistory: [],
      reference: 'PORE-O9UD-0025',
      status: 'ON_HOLD',
      type: 'REVIEW',
      updatedAt: expect.any(Date)
    }

    expect(result).toEqual({
      claim: expectedClaim,
      herdData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        applicationReference: 'POUL-8ZPZ-8CLI',
        species: 'poultry',
        name: 'Broilers Unit',
        cph: '81/445/6789',
        createdBy: 'admin',
        isCurrent: true,
        reasons: []
      }
    })
    expect(mockSession.endSession).toHaveBeenCalled()
    expect(raiseClaimEvents).toHaveBeenCalledWith(
      {
        message: 'New claim has been created',
        claim: { ...expectedClaim, id: '6916f837292fe87d2bac0d5c' },
        raisedBy: claimPayload.createdBy,
        raisedOn: expect.any(Date)
      },
      '123456789'
    )
    expect(generateClaimStatus).toHaveBeenCalledWith('2025-01-01T00:00:00Z', logger, mockDb)
  })

  it('should use fixed poultry price for amount', async () => {
    const claimPayload = {
      applicationReference: 'POUL-8ZPZ-8CLI',
      data: {
        typesOfPoultry: ['broilers'],
        dateOfReview: '2025-01-01T00:00:00Z',
        minimumNumberOfBirds: 'yes',
        vetsName: 'Dr Smith',
        vetRCVSNumber: '1234567',
        biosecurity: 'yes',
        biosecurityUsefulness: 'very-useful',
        changesInBiosecurity: 'bird-handling',
        costOfChanges: 'over-4500',
        interview: 'no',
        site: {
          cph: '81/445/6789',
          id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
          name: 'Broilers Unit',
          version: 1
        }
      },
      createdBy: 'admin',
      type: 'REVIEW'
    }

    processSite.mockResolvedValue({
      claimSiteData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        name: 'Broilers Unit',
        version: 1,
        cph: '81/445/6789'
      },
      siteData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        species: 'poultry',
        name: 'Broilers Unit',
        cph: '81/445/6789'
      },
      updated: true
    })
    generateClaimStatus.mockResolvedValue('ON_HOLD')
    createClaim.mockResolvedValue({
      insertedId: '6916f837292fe87d2bac0d5c'
    })

    const result = await savePoultryClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      claimPayload,
      claimReference: 'PORE-O9UD-0025',
      logger
    })

    expect(result.claim.data.amount).toBe(430)
  })

  it('should throw error when site update is attempted', async () => {
    const claimPayload = {
      applicationReference: 'POUL-8ZPZ-8CLI',
      data: {
        typesOfPoultry: ['broilers'],
        dateOfReview: '2025-01-01T00:00:00Z',
        minimumNumberOfBirds: 'yes',
        vetsName: 'Dr Smith',
        vetRCVSNumber: '1234567',
        biosecurity: 'yes',
        biosecurityUsefulness: 'very-useful',
        changesInBiosecurity: 'bird-handling',
        costOfChanges: 'over-4500',
        interview: 'no',
        site: {
          cph: '81/445/6789',
          id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
          name: 'Broilers Unit',
          version: 2
        }
      },
      createdBy: 'admin',
      type: 'REVIEW'
    }

    processSite.mockRejectedValue(new Error('Site updates are not supported'))

    await expect(
      savePoultryClaimAndRelatedData({
        db: mockDb,
        sbi: '123456789',
        claimPayload,
        claimReference: 'PORE-O9UD-0025',
        logger
      })
    ).rejects.toThrow('Site updates are not supported')

    expect(createClaim).not.toHaveBeenCalled()
  })

  it('should include empty reasons array in herdData for compatibility', async () => {
    const claimPayload = {
      applicationReference: 'POUL-8ZPZ-8CLI',
      data: {
        typesOfPoultry: ['laying'],
        dateOfReview: '2025-01-01T00:00:00Z',
        minimumNumberOfBirds: 'yes',
        vetsName: 'Dr Smith',
        vetRCVSNumber: '1234567',
        biosecurity: 'yes',
        biosecurityUsefulness: 'very-useful',
        changesInBiosecurity: 'bird-handling',
        costOfChanges: 'over-4500',
        interview: 'no',
        site: {
          cph: '81/445/6789',
          id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
          name: 'Laying Hens Unit',
          version: 1
        }
      },
      createdBy: 'admin',
      type: 'REVIEW'
    }

    processSite.mockResolvedValue({
      claimSiteData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        name: 'Laying Hens Unit',
        version: 1,
        cph: '81/445/6789'
      },
      siteData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        species: 'poultry',
        name: 'Laying Hens Unit',
        cph: '81/445/6789'
      },
      updated: true
    })
    generateClaimStatus.mockResolvedValue('ON_HOLD')
    createClaim.mockResolvedValue({
      insertedId: '6916f837292fe87d2bac0d5c'
    })

    const result = await savePoultryClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      claimPayload,
      claimReference: 'PORE-O9UD-0025',
      logger
    })

    expect(result.herdData.reasons).toEqual([])
  })
})

describe('generatePoultryEventsAndComms', () => {
  const mockApp = {
    reference: 'POUL-8ZPZ-8CLI',
    organisation: { sbi: '123456789', crn: 'CRN-999' }
  }

  const claim = {
    reference: 'PORE-O9UD-0025',
    type: 'REVIEW',
    status: 'ON_HOLD',
    data: {
      amount: 430,
      typesOfPoultry: ['broilers', 'ducks']
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should emit herd events, send status notification, and log event message', async () => {
    const mockLogger = { info: jest.fn(), error: jest.fn() }
    getLogger.mockReturnValueOnce(mockLogger)
    const herdData = { name: 'Broilers Unit' }

    await generatePoultryEventsAndComms(claim, mockApp, herdData, 'SITE-1')

    expect(emitHerdMIEvents).toHaveBeenCalledWith({
      sbi: '123456789',
      herdData,
      herdIdSelected: 'SITE-1',
      herdGotUpdated: false,
      claimReference: 'PORE-O9UD-0025',
      applicationReference: 'POUL-8ZPZ-8CLI'
    })

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(mockLogger, {
      agreementReference: 'POUL-8ZPZ-8CLI',
      claimAmount: 430,
      claimReference: 'PORE-O9UD-0025',
      claimStatus: 'ON_HOLD',
      claimType: 'REVIEW',
      crn: 'CRN-999',
      dateTime: expect.any(Date),
      herdName: 'Broilers Unit',
      sbi: '123456789',
      typesOfPoultry: ['broilers', 'ducks']
    })

    expect(mockLogger.info).toHaveBeenCalledWith({
      event: {
        category: 'Poultry',
        created: expect.any(Date),
        kind: 'REVIEW',
        outcome: 'Status - ON_HOLD',
        reference: '123456789 - POUL-8ZPZ-8CLI - PORE-O9UD-0025',
        type: 'process-claim'
      }
    })
  })

  it('should always pass herdGotUpdated as false since sites are never updated', async () => {
    const mockLogger = { info: jest.fn(), error: jest.fn() }
    getLogger.mockReturnValueOnce(mockLogger)
    const herdData = { name: 'Laying Hens Unit' }

    await generatePoultryEventsAndComms(claim, mockApp, herdData, 'SITE-2')

    expect(emitHerdMIEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        herdGotUpdated: false
      })
    )
  })

  it('should use site name directly as herdName', async () => {
    const mockLogger = { info: jest.fn(), error: jest.fn() }
    getLogger.mockReturnValueOnce(mockLogger)
    const herdData = { name: 'Turkey Farm' }

    await generatePoultryEventsAndComms(claim, mockApp, herdData, 'SITE-3')

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      mockLogger,
      expect.objectContaining({
        herdName: 'Turkey Farm'
      })
    )
  })
})
