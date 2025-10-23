import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import { createClaimHandler, isURNUniqueHandler } from './claims-controller.js'
import { processClaim, isURNNumberUnique } from './claims-service.js'

jest.mock('./claims-service.js')

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

    await expect(createClaimHandler(mockRequest, mockH)).rejects.toThrow(
      boomError
    )
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

    await expect(isURNUniqueHandler(mockRequest, mockH)).rejects.toThrow(
      boomError
    )
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
