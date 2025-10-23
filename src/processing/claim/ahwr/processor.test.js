import { saveClaimAndRelatedData } from './processor.js'
import { getAmount } from '../../../lib/getAmount.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import {
  getByApplicationReference,
  createClaim
} from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { processHerd } from './herd-processor.js'

jest.mock('../../../lib/getAmount.js')
jest.mock('../../../lib/context-helper.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../lib/requires-compliance-check.js')
jest.mock('../../../lib/emit-herd-MI-events.js')
jest.mock('../../../messaging/send-message.js')
jest.mock('./herd-processor.js')
jest.mock('uuid')
jest.mock('applicationinsights')

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
    const payload = {
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
    createClaim.mockResolvedValue()

    const result = await saveClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      payload,
      claimReference: 'RESH-O9UD-0025',
      flags: [],
      logger
    })

    expect(getAmount).toHaveBeenCalledWith(payload)
    expect(isMultipleHerdsUserJourney).toHaveBeenCalledWith(
      payload.data.dateOfVisit,
      []
    )
    expect(processHerd).toHaveBeenCalled()
    expect(createClaim).toHaveBeenCalled()
    expect(result).toEqual({
      claim: {
        applicationReference: 'IAHW-8ZPZ-8CLI',
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
        reference: 'RESH-O9UD-0025',
        status: 'PENDING',
        type: 'REVIEW'
      },
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
  })

  it('should save claim without herd', async () => {
    const payload = {
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
    createClaim.mockResolvedValue()

    const result = await saveClaimAndRelatedData({
      db: mockDb,
      sbi: '123456789',
      payload,
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

// describe('generateEventsAndComms', () => {
//   const mockApp = {
//     reference: 'APP-999',
//     data: { organisation: { sbi: 'SBI-123', crn: 'CRN-999' } }
//   }

//   const claim = {
//     reference: 'CLM-999',
//     type: 'REVIEW',
//     statusId: 'PENDING',
//     data: {
//       amount: 100,
//       typeOfLivestock: TYPE_OF_LIVESTOCK.SHEEP,
//       dateOfVisit: '2025-01-01',
//       reviewTestResults: [],
//       piHuntRecommended: false,
//       piHuntAllAnimals: false
//     }
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     uuid.mockReturnValue('uuid-1234')
//     appInsights.defaultClient = { trackEvent: jest.fn() }
//   })

//   it('should emit herd events and send message for multi-herd claim', async () => {
//     const herdData = { name: 'My Herd' }
//     await generateEventsAndComms(true, claim, mockApp, herdData, true, 'HERD-1')

//     expect(emitHerdMIEvents).toHaveBeenCalledWith(
//       expect.objectContaining({
//         sbi: 'SBI-123',
//         herdData,
//         herdIdSelected: 'HERD-1',
//         herdGotUpdated: true,
//         claimReference: 'CLM-999',
//         applicationReference: 'APP-999'
//       })
//     )
//     expect(sendMessage).toHaveBeenCalledWith(
//       expect.objectContaining({
//         claimReference: 'CLM-999',
//         sbi: 'SBI-123',
//         claimAmount: 100
//       }),
//       config.messageGeneratorMsgType,
//       config.messageGeneratorQueue,
//       { sessionId: 'uuid-1234' }
//     )
//     expect(appInsights.defaultClient.trackEvent).toHaveBeenCalled()
//   })

//   it('should send message with unnamed herd if herd name missing', async () => {
//     const herdData = {}
//     await generateEventsAndComms(
//       false,
//       claim,
//       mockApp,
//       herdData,
//       false,
//       'HERD-1'
//     )

//     expect(sendMessage).toHaveBeenCalledWith(
//       expect.objectContaining({
//         herdName: UNNAMED_FLOCK
//       }),
//       expect.anything(),
//       expect.anything(),
//       expect.anything()
//     )
//   })
// })
