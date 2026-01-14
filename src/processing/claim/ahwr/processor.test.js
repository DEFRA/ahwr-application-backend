import { saveClaimAndRelatedData, generateEventsAndComms } from './processor.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import { getByApplicationReference, createClaim } from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { processHerd } from './herd-processor.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import { getAmount } from 'ffc-ahwr-common-library'
import { publishStatusChangeEvent } from '../../../messaging/publish-outbound-notification.js'
import { getLogger } from '../../../logging/logger.js'

jest.mock('ffc-ahwr-common-library')
jest.mock('../../../lib/context-helper.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../lib/requires-compliance-check.js')
jest.mock('../../../lib/emit-herd-MI-events.js')
jest.mock('./herd-processor.js')
jest.mock('../../../event-publisher/index.js')
jest.mock('../../../messaging/publish-outbound-notification.js')
jest.mock('../../../logging/logger.js')

const mockSession = {
  withTransaction: jest.fn((fn) => fn()),
  endSession: jest.fn()
}
const mockDb = { client: { startSession: jest.fn(() => mockSession) } }

const logger = { info: jest.fn(), error: jest.fn() }

describe('saveClaimAndRelatedData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should save claim and herd', async () => {
    const claimPayload = {
      applicationReference: 'IAHW-8ZPZ-8CLI',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: '2025-01-01T00:00:00Z',
        herd: {
          cph: '81/445/6789',
          id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
          name: 'Herd B',
          reasons: ['separateManagementNeeds'],
          version: 1
        }
      },
      createdBy: 'admin',
      type: 'REVIEW'
    }
    getAmount.mockResolvedValue(200)
    isMultipleHerdsUserJourney.mockReturnValue(true)
    processHerd.mockResolvedValue({
      claimHerdData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        name: 'Herd B',
        reasons: ['separateManagementNeeds'],
        version: 1,
        associatedAt: '2025-10-20T00:00:00.000Z',
        cph: '81/445/6789'
      },
      herdData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef',
        name: 'Herd B',
        cph: '81/445/6789',
        reasons: ['separateManagementNeeds'],
        createdBy: 'admin',
        isCurrent: true
      },
      updated: true
    })
    getByApplicationReference.mockResolvedValue([])
    generateClaimStatus.mockResolvedValue('PENDING')
    createClaim.mockResolvedValue({
      insertedId: '6916f837292fe87d2bac0d5c'
    })

    const result = await saveClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      claimPayload,
      claimReference: 'RESH-O9UD-0025',
      flags: [],
      logger
    })

    expect(getAmount).toHaveBeenCalledWith({ ...claimPayload.data, type: claimPayload.type })
    expect(isMultipleHerdsUserJourney).toHaveBeenCalledWith(claimPayload.data.dateOfVisit, [])
    expect(processHerd).toHaveBeenCalled()
    const expectedClaim = {
      applicationReference: 'IAHW-8ZPZ-8CLI',
      createdAt: expect.any(Date),
      createdBy: 'admin',
      data: {
        amount: 200,
        claimType: 'REVIEW',
        dateOfVisit: '2025-01-01T00:00:00Z',
        typeOfLivestock: 'sheep'
      },
      herd: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        name: 'Herd B',
        reasons: ['separateManagementNeeds'],
        version: 1,
        associatedAt: '2025-10-20T00:00:00.000Z',
        cph: '81/445/6789'
      },
      statusHistory: [
        {
          status: 'PENDING',
          createdBy: 'admin',
          createdAt: expect.any(Date)
        }
      ],
      updateHistory: [],
      reference: 'RESH-O9UD-0025',
      status: 'PENDING',
      type: 'REVIEW',
      updatedAt: expect.any(Date)
    }
    expect(result).toEqual({
      claim: expectedClaim,
      herdGotUpdated: true,
      herdData: {
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef',
        name: 'Herd B',
        cph: '81/445/6789',
        reasons: ['separateManagementNeeds'],
        createdBy: 'admin',
        isCurrent: true
      },
      isMultiHerdsClaim: true
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

  it('should save claim without herd', async () => {
    const claimPayload = {
      applicationReference: 'IAHW-8ZPZ-8CLI',
      data: {
        typeOfLivestock: 'beef',
        dateOfVisit: '2025-01-01T00:00:00Z'
      },
      createdBy: 'admin',
      type: 'REVIEW'
    }

    getAmount.mockResolvedValue(300)
    isMultipleHerdsUserJourney.mockReturnValue(false)
    getByApplicationReference.mockResolvedValue([])
    generateClaimStatus.mockResolvedValue('APPROVED')
    createClaim.mockResolvedValue({
      insertedId: '6916f837292fe87d2bac0d5c'
    })

    const result = await saveClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      claimPayload,
      claimReference: 'RESH-O9UD-0025',
      flags: [],
      logger
    })

    expect(processHerd).not.toHaveBeenCalled()
    expect(result.isMultiHerdsClaim).toBe(false)
    expect(result.claim.status).toBe('APPROVED')
    expect(mockSession.endSession).toHaveBeenCalled()
  })
})

describe('generateEventsAndComms', () => {
  const mockApp = {
    reference: 'APP-999',
    organisation: { sbi: 'SBI-123', crn: 'CRN-999' }
  }

  const claim = {
    reference: 'CLM-999',
    type: 'REVIEW',
    status: 'ON_HOLD',
    data: {
      amount: 100,
      typeOfLivestock: 'sheep',
      dateOfVisit: '2025-01-01',
      reviewTestResults: [],
      piHuntRecommended: false,
      piHuntAllAnimals: false
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should emit herd events, send status notification, and log event message for multi-herd claim', async () => {
    const mockLogger = { info: jest.fn(), error: jest.fn() }
    getLogger.mockReturnValueOnce(mockLogger)
    const herdData = { name: 'My Herd' }
    await generateEventsAndComms(true, claim, mockApp, herdData, true, 'HERD-1')

    expect(emitHerdMIEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        sbi: 'SBI-123',
        herdData,
        herdIdSelected: 'HERD-1',
        herdGotUpdated: true,
        claimReference: 'CLM-999',
        applicationReference: 'APP-999'
      })
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(mockLogger, {
      agreementReference: 'APP-999',
      claimAmount: 100,
      claimReference: 'CLM-999',
      claimStatus: 'ON_HOLD',
      claimType: 'REVIEW',
      crn: 'CRN-999',
      dateTime: expect.any(Date),
      herdName: 'My Herd',
      piHuntAllAnimals: false,
      piHuntRecommended: false,
      reviewTestResults: [],
      sbi: 'SBI-123',
      typeOfLivestock: 'sheep'
    })

    expect(mockLogger.info).toHaveBeenCalledWith({
      event: {
        category: 'sheep',
        created: expect.any(Date),
        kind: 'REVIEW',
        outcome: 'Status - ON_HOLD',
        reference: 'SBI-123 - APP-999 - CLM-999',
        type: 'process-claim'
      }
    })
  })

  it('should send message with unnamed herd if herd name missing', async () => {
    const mockLogger = { info: jest.fn(), error: jest.fn() }
    getLogger.mockReturnValueOnce(mockLogger)
    const herdData = {}
    await generateEventsAndComms(false, claim, mockApp, herdData, false, 'HERD-1')

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(mockLogger, {
      agreementReference: 'APP-999',
      claimAmount: 100,
      claimReference: 'CLM-999',
      claimStatus: 'ON_HOLD',
      claimType: 'REVIEW',
      crn: 'CRN-999',
      dateTime: expect.any(Date),
      herdName: 'Unnamed flock',
      piHuntAllAnimals: false,
      piHuntRecommended: false,
      reviewTestResults: [],
      sbi: 'SBI-123',
      typeOfLivestock: 'sheep'
    })
  })
})
