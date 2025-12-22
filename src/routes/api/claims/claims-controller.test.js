import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import {
  createClaimHandler,
  isURNUniqueHandler,
  getClaimHandler,
  updateClaimStatusHandler,
  updateClaimDataHandler
} from './claims-controller.js'
import { processClaim, isURNNumberUnique, getClaim } from './claims-service.js'
import {
  getClaimByReference,
  updateClaimData,
  updateClaimStatus
} from '../../../repositories/claim-repository.js'
import { ObjectId } from 'mongodb'
import { findApplication, getApplication } from '../../../repositories/application-repository.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import { STATUS } from 'ffc-ahwr-common-library'
import {
  publishRequestForPaymentEvent,
  publishStatusChangeEvent
} from '../../../messaging/publish-outbound-notification.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../lib/context-helper.js'
import { claimDataUpdateEvent } from '../../../event-publisher/claim-data-update-event.js'

jest.mock('./claims-service.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../event-publisher/index.js')
jest.mock('../../../messaging/publish-outbound-notification.js')
jest.mock('../../../event-publisher/claim-data-update-event.js')
jest.mock('../../../lib/context-helper.js')

describe('createClaimHandler', () => {
  const mockRequest = {
    payload: {
      applicationReference: 'IAHW-AAAA-AAAA',
      reference: 'TEMP-CLAIM-O9UD-0025',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: '2025-10-20T00:00:00.000Z',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        vetsName: 'Afshin',
        vetRCVSNumber: 'AK-2024',
        laboratoryURN: 'AK-2024-38',
        numberAnimalsTested: 30,
        speciesNumbers: 'yes',
        herd: {
          id: '123456789',
          version: 1,
          name: 'Sheep herd 2',
          cph: 'someCph',
          reasons: ['reasonOne', 'reasonTwo'],
          same: 'yes'
        }
      },
      type: 'REVIEW',
      createdBy: 'admin'
    },
    logger: { error: jest.fn(), info: jest.fn() },
    db: {}
  }
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 and the created claim when successful', async () => {
    const mockClaim = {
      applicationReference: 'IAHW-AAAA-AAAA',
      reference: 'RESH-O9UD-0025',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: '2025-10-20T00:00:00.000Z',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        vetsName: 'Afshin',
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
        cph: 'someCph',
        name: 'Sheep herd 2',
        reasons: ['reasonOne', 'reasonTwo'],
        associatedAt: '2025-10-21T09:28:49.760Z'
      }
    }

    processClaim.mockResolvedValue(mockClaim)

    const result = await createClaimHandler(mockRequest, mockH)

    expect(processClaim).toHaveBeenCalledWith({
      payload: mockRequest.payload,
      logger: mockRequest.logger,
      db: mockRequest.db
    })
    expect(mockH.response).toHaveBeenCalledWith(mockClaim)
    expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
    expect(result).toBe(mockH)
  })

  it('should rethrow Boom errors', async () => {
    const boomError = Boom.badRequest('Invalid input')
    processClaim.mockRejectedValue(boomError)

    await expect(createClaimHandler(mockRequest, mockH)).rejects.toThrow(boomError)
    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      { err: boomError },
      'Failed to create claim'
    )
  })

  it('should wrap non-Boom errors in Boom.internal', async () => {
    const genericError = new Error('Database failure')
    processClaim.mockRejectedValue(genericError)

    await expect(createClaimHandler(mockRequest, mockH)).rejects.toThrow(
      Boom.internal(genericError)
    )
    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      { err: genericError },
      'Failed to create claim'
    )
  })
})

describe('isURNUniqueHandler', () => {
  const mockRequest = {
    payload: {
      sbi: '123456789',
      laboratoryURN: 'URN34567ddd'
    },
    logger: { error: jest.fn(), info: jest.fn() },
    db: {}
  }
  const mockResult = {
    isURNUnique: true
  }
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 and the result', async () => {
    isURNNumberUnique.mockResolvedValue(mockResult)

    const result = await isURNUniqueHandler(mockRequest, mockH)

    expect(isURNNumberUnique).toHaveBeenCalledWith({
      laboratoryURN: 'URN34567ddd',
      sbi: '123456789',
      db: mockRequest.db
    })
    expect(mockH.response).toHaveBeenCalledWith(mockResult)
    expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
    expect(result).toBe(mockH)
  })

  it('should rethrow Boom errors', async () => {
    const boomError = Boom.badRequest('Invalid input')
    isURNNumberUnique.mockRejectedValue(boomError)

    await expect(isURNUniqueHandler(mockRequest, mockH)).rejects.toThrow(boomError)
    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      { err: boomError },
      'Failed to check if URN is unique'
    )
  })

  it('should wrap non-Boom errors in Boom.internal', async () => {
    const genericError = new Error('Database failure')
    isURNNumberUnique.mockRejectedValue(genericError)

    await expect(isURNUniqueHandler(mockRequest, mockH)).rejects.toThrow(
      Boom.internal(genericError)
    )
    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      { err: genericError },
      'Failed to check if URN is unique'
    )
  })
})

describe('getClaimHandler', () => {
  const mockRequest = {
    logger: { error: jest.fn(), info: jest.fn() },
    db: {},
    params: {
      reference: 'REBC-VA4R-TRL7'
    }
  }
  const mockResult = {
    applicationReference: 'IAHW-G3CL-V59P',
    createdAt: '2025-04-24T08:24:24.092Z',
    data: {
      amount: 522,
      claimType: 'R',
      dateOfTesting: '2025-04-24T00:00:00.000Z',
      dateOfVisit: '2025-04-25T00:00:00.000Z',
      laboratoryURN: 'w5436346ret',
      numberAnimalsTested: '10',
      speciesNumbers: 'yes',
      testResults: 'negative',
      typeOfLivestock: 'beef',
      vetRCVSNumber: '1111111',
      vetsName: 'Mr C test'
    },
    herd: {},
    reference: 'REBC-VA4R-TRL7',
    status: 'IN_CHECK',
    statusHistory: [],
    type: 'REVIEW',
    updateHistory: [
      {
        createdAt: '2025-04-25T13:05:39.937Z',
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-vetsName',
        id: 'e3d320b7-b2cf-469a-903f-ead7587d98e9',
        newValue: 'Mr C test',
        note: 'Updated to check event',
        oldValue: 'Mr B Test',
        updatedProperty: 'vetsName'
      }
    ]
  }

  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 and the result', async () => {
    getClaim.mockResolvedValue(mockResult)

    const result = await getClaimHandler(mockRequest, mockH)

    expect(getClaim).toHaveBeenCalledWith({
      db: mockRequest.db,
      logger: mockRequest.logger,
      reference: 'REBC-VA4R-TRL7'
    })
    expect(mockH.response).toHaveBeenCalledWith(mockResult)
    expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
    expect(result).toBe(mockH)
  })

  it('should rethrow Boom errors', async () => {
    const boomError = Boom.badRequest('Invalid input')
    getClaim.mockRejectedValue(boomError)

    await expect(getClaimHandler(mockRequest, mockH)).rejects.toThrow(boomError)

    expect(mockRequest.logger.error).toHaveBeenCalledWith({ err: boomError }, 'Failed to get claim')
  })

  it('should wrap non-Boom errors in Boom.internal', async () => {
    const genericError = new Error('Database failure')
    getClaim.mockRejectedValue(genericError)

    await expect(getClaimHandler(mockRequest, mockH)).rejects.toThrow(Boom.internal(genericError))
    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      { err: genericError },
      'Failed to get claim'
    )
  })
})

describe('updateClaimStatusHandler', () => {
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis(),
    takeover: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()

    getApplication.mockResolvedValueOnce({
      organisation: {
        sbi: '106705779',
        crn: '1100014934',
        frn: '1102569649'
      }
    })
  })

  test.each([
    { status: 'IN_CHECK', useOldWorldTestResults: false },
    { status: 'READY_TO_PAY', useOldWorldTestResults: false },
    { status: 'REJECTED', useOldWorldTestResults: true }
  ])('Update claim status to status $status', async ({ status, useOldWorldTestResults }) => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementationOnce(() => {
      return true
    })
    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status,
        user: 'admin'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      reference: 'REBC-J9AR-KILQ',
      applicationReference: 'AHWR-KJLI-2678',
      data: {
        typeOfLivestock: 'sheep',
        ...(useOldWorldTestResults && { reviewTestResults: 'positive' }),
        ...(!useOldWorldTestResults && { vetVisitsReviewTestResults: 'positive' }),
        dateOfVisit: new Date('2025-04-24T00:00:00.000Z')
      },
      herd: {
        name: 'sheepies'
      },
      type: 'REVIEW'
    })
    updateClaimStatus.mockResolvedValueOnce({
      _id: new ObjectId('691df90a35d046309ef9fe45'),
      reference: 'REBC-J9AR-KILQ',
      status,
      updatedAt: new Date('2025-04-24T08:24:24.092Z'),
      updatedBy: 'user'
    })

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(200)
    expect(updateClaimStatus).toHaveBeenCalledWith({
      db: {},
      reference: 'REBC-J9AR-KILQ',
      status,
      updatedAt: expect.any(Date),
      user: 'admin'
    })
    expect(raiseClaimEvents).toHaveBeenCalledWith(
      {
        message: 'Claim has been updated',
        claim: {
          _id: new ObjectId('691df90a35d046309ef9fe45'),
          id: '691df90a35d046309ef9fe45',
          reference: 'REBC-J9AR-KILQ',
          status,
          updatedAt: new Date('2025-04-24T08:24:24.092Z'),
          updatedBy: 'user'
        },
        note: undefined,
        raisedBy: 'user',
        raisedOn: new Date('2025-04-24T08:24:24.092Z')
      },
      '106705779'
    )
    if (status === STATUS.READY_TO_PAY) {
      expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(mockLogger, {
        reference: 'REBC-J9AR-KILQ',
        sbi: '106705779',
        whichReview: 'sheep',
        isEndemics: true,
        claimType: 'REVIEW',
        reviewTestResults: 'positive',
        frn: '1102569649',
        optionalPiHuntValue: 'noPiHunt'
      })
    }
    expect(publishStatusChangeEvent).toHaveBeenCalledWith(mockLogger, {
      crn: '1100014934',
      sbi: '106705779',
      agreementReference: 'AHWR-KJLI-2678',
      claimReference: 'REBC-J9AR-KILQ',
      claimAmount: undefined,
      claimStatus: status,
      claimType: 'REVIEW',
      typeOfLivestock: 'sheep',
      reviewTestResults: 'positive',
      dateTime: expect.any(Date),
      herdName: 'sheepies'
    })
  })

  test('Update claim should fail when claim does not exist', async () => {
    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'admin'
      }
    }

    getClaimByReference.mockResolvedValueOnce(null)

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(404)
    expect(updateClaimStatus).not.toHaveBeenCalled()
    expect(raiseClaimEvents).not.toHaveBeenCalled()
    expect(publishStatusChangeEvent).not.toHaveBeenCalled()
    expect(publishRequestForPaymentEvent).not.toHaveBeenCalled()
  })

  test('should update claim and submit payment request when piHunt is yes', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => {
      return true
    })

    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'some user',
        note: 'updating status'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      reference: 'REBC-J9AR-KILQ',
      applicationReference: 'AHWR-KJLI-2678',
      data: {
        typeOfLivestock: 'sheep',
        reviewTestResults: 'positive',
        dateOfVisit: new Date('2025-04-24T00:00:00.000Z'),
        piHunt: 'yes',
        piHuntAllAnimals: 'yes'
      },
      herd: {
        name: 'sheepies'
      },
      type: 'FOLLOW_UP'
    })
    updateClaimStatus.mockResolvedValueOnce({
      _id: new ObjectId('691df90a35d046309ef9fe45'),
      reference: 'REBC-J9AR-KILQ',
      status: 'READY_TO_PAY',
      updatedAt: new Date('2025-04-24T08:24:24.092Z'),
      updatedBy: 'some user'
    })

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(200)

    expect(updateClaimStatus).toHaveBeenCalledWith({
      db: {},
      reference: 'REBC-J9AR-KILQ',
      status: 'READY_TO_PAY',
      updatedAt: expect.any(Date),
      user: 'some user',
      note: 'updating status'
    })

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(mockLogger, {
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      whichReview: 'sheep',
      isEndemics: true,
      claimType: 'FOLLOW_UP',
      reviewTestResults: 'positive',
      frn: '1102569649',
      optionalPiHuntValue: 'yesPiHunt'
    })

    expect(publishStatusChangeEvent).toHaveBeenCalled()
  })

  test('should update claim and submit payment request when piHunt is yes and piHuntRecommended is yes for negative review', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => {
      return true
    })

    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'some user',
        note: 'updating status'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      reference: 'REBC-J9AR-KILQ',
      applicationReference: 'AHWR-KJLI-2678',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: new Date('2025-04-24T00:00:00.000Z'),
        reviewTestResults: 'negative',
        piHunt: 'yes',
        piHuntAllAnimals: 'yes',
        piHuntRecommended: 'yes',
        testResults: 'negative'
      },
      herd: {
        name: 'sheepies'
      },
      type: 'FOLLOW_UP'
    })
    updateClaimStatus.mockResolvedValueOnce({
      _id: new ObjectId('691df90a35d046309ef9fe45'),
      reference: 'REBC-J9AR-KILQ',
      status: 'READY_TO_PAY',
      updatedAt: new Date('2025-04-24T08:24:24.092Z'),
      updatedBy: 'some user'
    })

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(200)

    expect(updateClaimStatus).toHaveBeenCalledWith({
      db: {},
      reference: 'REBC-J9AR-KILQ',
      status: 'READY_TO_PAY',
      updatedAt: expect.any(Date),
      user: 'some user',
      note: 'updating status'
    })

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(mockLogger, {
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      whichReview: 'sheep',
      isEndemics: true,
      claimType: 'FOLLOW_UP',
      reviewTestResults: 'negative',
      frn: '1102569649',
      optionalPiHuntValue: 'yesPiHunt'
    })

    expect(publishStatusChangeEvent).toHaveBeenCalled()
  })

  test('should update claim and submit payment request when piHunt is no', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => {
      return true
    })

    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'some user',
        note: 'updating status'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      reference: 'REBC-J9AR-KILQ',
      applicationReference: 'AHWR-KJLI-2678',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: new Date('2025-04-24T00:00:00.000Z'),
        reviewTestResults: 'positive',
        piHunt: 'no',
        piHuntAllAnimals: 'no'
      },
      herd: {
        name: 'sheepies'
      },
      type: 'FOLLOW_UP'
    })
    updateClaimStatus.mockResolvedValueOnce({
      _id: new ObjectId('691df90a35d046309ef9fe45'),
      reference: 'REBC-J9AR-KILQ',
      status: 'READY_TO_PAY',
      updatedAt: new Date('2025-04-24T08:24:24.092Z'),
      updatedBy: 'some user'
    })

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(200)

    expect(updateClaimStatus).toHaveBeenCalled()

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(mockLogger, {
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      whichReview: 'sheep',
      isEndemics: true,
      claimType: 'FOLLOW_UP',
      reviewTestResults: 'positive',
      frn: '1102569649',
      optionalPiHuntValue: 'noPiHunt'
    })

    expect(publishStatusChangeEvent).toHaveBeenCalled()
  })

  test('should update claim and submit payment request when optionalPiHunt not in play', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => {
      return false
    })

    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'some user',
        note: 'updating status'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      reference: 'REBC-J9AR-KILQ',
      applicationReference: 'AHWR-KJLI-2678',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: new Date('2025-04-24T00:00:00.000Z'),
        reviewTestResults: 'positive',
        piHunt: 'no',
        piHuntAllAnimals: 'no'
      },
      type: 'FOLLOW_UP'
    })
    updateClaimStatus.mockResolvedValueOnce({
      _id: new ObjectId('691df90a35d046309ef9fe45'),
      reference: 'REBC-J9AR-KILQ',
      status: 'READY_TO_PAY',
      updatedAt: new Date('2025-04-24T08:24:24.092Z'),
      updatedBy: 'some user'
    })

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(200)

    expect(updateClaimStatus).toHaveBeenCalled()

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(mockLogger, {
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      whichReview: 'sheep',
      isEndemics: true,
      claimType: 'FOLLOW_UP',
      reviewTestResults: 'positive',
      frn: '1102569649'
    })

    expect(publishStatusChangeEvent).toHaveBeenCalled()
  })

  test('should do nothing and return no content when status is the same as one already on claim', async () => {
    const mockLogger = { error: jest.fn(), info: jest.fn() }
    const mockRequest = {
      logger: mockLogger,
      db: {},
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'some user',
        note: 'updating status'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      reference: 'REBC-J9AR-KILQ',
      applicationReference: 'AHWR-KJLI-2678',
      data: {
        typeOfLivestock: 'sheep',
        dateOfVisit: new Date('2025-04-24T00:00:00.000Z'),
        reviewTestResults: 'positive',
        piHunt: 'no',
        piHuntAllAnimals: 'no'
      },
      status: 'READY_TO_PAY',
      type: 'FOLLOW_UP'
    })

    await updateClaimStatusHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(204)

    expect(updateClaimStatus).not.toHaveBeenCalled()

    expect(publishRequestForPaymentEvent).not.toHaveBeenCalled()

    expect(publishStatusChangeEvent).not.toHaveBeenCalled()
  })
})

describe('updateClaimDataHandler', () => {
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis(),
    takeover: jest.fn().mockReturnThis()
  }

  const mockLogger = { error: jest.fn(), info: jest.fn(), setBindings: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()

    getApplication.mockResolvedValueOnce({
      organisation: {
        sbi: '106705779',
        crn: '1100014934',
        frn: '1102569649'
      }
    })
  })

  test('should return 404 when claim is not found', async () => {
    const mockRequest = {
      logger: mockLogger,
      db: {},
      params: { reference: 'FUBC-JTTU-SDQ7' },
      payload: {
        vetsName: 'New Vet',
        user: 'tester',
        note: 'Changed vet name'
      }
    }
    getClaimByReference.mockResolvedValue(null)

    await updateClaimDataHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(404)
  })

  test('should return 204 when no data changes', async () => {
    const mockDb = {}
    const mockRequest = {
      logger: mockLogger,
      db: mockDb,
      params: { reference: 'FUBC-JTTU-SDQ7' },
      payload: {
        vetsName: 'New Vet',
        user: 'tester',
        note: 'Changed vet name'
      }
    }
    getClaimByReference.mockResolvedValue({
      data: { vetsName: 'New Vet' }
    })

    await updateClaimDataHandler(mockRequest, mockH)

    expect(mockH.code).toHaveBeenCalledWith(204)
    expect(updateClaimData).not.toHaveBeenCalled()
    expect(claimDataUpdateEvent).not.toHaveBeenCalled()
  })

  test('should return 204 and update the claim when data has changed', async () => {
    const mockDb = {}
    const mockRequest = {
      logger: mockLogger,
      db: mockDb,
      params: { reference: 'FUBC-JTTU-SDQ7' },
      payload: {
        vetsName: 'New Vet',
        user: 'tester',
        note: 'Changed vet name'
      }
    }

    getClaimByReference.mockResolvedValue({
      data: { vetsName: 'Old Vet' },
      applicationReference: 'IAHW-G3CL-V59P'
    })
    updateClaimData.mockResolvedValue({
      applicationReference: 'IAHW-G3CL-V59P'
    })
    findApplication.mockResolvedValue({
      organisation: { sbi: '123456789' }
    })

    await updateClaimDataHandler(mockRequest, mockH)

    expect(updateClaimData).toHaveBeenCalledWith({
      db: mockDb,
      reference: 'FUBC-JTTU-SDQ7',
      updatedProperty: 'vetsName',
      newValue: 'New Vet',
      oldValue: 'Old Vet',
      note: 'Changed vet name',
      user: 'tester',
      updatedAt: expect.any(Date)
    })
    expect(claimDataUpdateEvent).toHaveBeenCalledWith(
      {
        applicationReference: 'IAHW-G3CL-V59P',
        reference: 'FUBC-JTTU-SDQ7',
        updatedProperty: 'vetsName',
        newValue: 'New Vet',
        oldValue: 'Old Vet',
        note: 'Changed vet name'
      },
      'claim-vetName',
      'tester',
      expect.any(Date),
      '123456789'
    )
    expect(mockH.code).toHaveBeenCalledWith(204)
  })
})
