import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'
import { STATUS } from 'ffc-ahwr-common-library'

jest.mock('../../../src/messaging/publish-outbound-notification.js')

describe('Create claim', () => {
  let server
  let options

  beforeAll(async () => {
    server = await setupTestEnvironment()
    options = {
      method: 'POST',
      url: '/api/claims',
      payload: {
        applicationReference: 'IAHW-G3CL-V59P',
        reference: 'TEMP-CLAIM-O9UD-0025',
        data: {
          typeOfLivestock: 'sheep',
          dateOfVisit: '2025-10-20T00:00:00.000Z',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          vetsName: 'Afshin',
          vetRCVSNumber: 'AK-2024',
          laboratoryURN: 'AK-2024-39',
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
      headers: { 'x-api-key': config.get('apiKeys.backofficeUiApiKey') }
    }
  })

  const originalComplianceCheckRatio = config.get('complianceCheckRatio')

  beforeEach(async () => {
    // Ratio <= 0 turns compliance checks off, so new claims are deterministically ON_HOLD
    config.set('complianceCheckRatio', 0)

    await server.db.collection('applications').deleteMany({})
    await server.db.collection('claims').deleteMany({})
    await server.db.collection('applications').insertOne(application)
  })

  afterAll(async () => {
    config.set('complianceCheckRatio', originalComplianceCheckRatio)
    await teardownTestEnvironment()
  })

  test('successfully creates a new claim with herd', async () => {
    const res = await server.inject(options)

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({
      _id: expect.any(String),
      applicationReference: 'IAHW-G3CL-V59P',
      createdBy: 'admin',
      createdAt: expect.any(String),
      data: {
        amount: 436,
        claimType: 'REVIEW',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        dateOfVisit: '2025-10-20T00:00:00.000Z',
        laboratoryURN: 'AK-2024-39',
        numberAnimalsTested: 30,
        speciesNumbers: 'yes',
        typeOfLivestock: 'sheep',
        vetRCVSNumber: 'AK-2024',
        vetsName: 'Afshin'
      },
      herd: {
        associatedAt: expect.any(String),
        cph: 'someCph',
        id: expect.any(String),
        name: 'Sheep herd 2',
        reasons: ['reasonOne', 'reasonTwo'],
        version: 1
      },
      reference: 'RESH-O9UD-0025',
      status: STATUS.ON_HOLD,
      statusHistory: [
        {
          createdAt: expect.any(String),
          createdBy: 'admin',
          status: STATUS.ON_HOLD
        }
      ],
      updateHistory: [],
      type: 'REVIEW',
      updatedAt: expect.any(String)
    })
  })

  test('creates the claim IN_CHECK when it is selected for a compliance check', async () => {
    // Ratio of 1 means every claim is selected for a compliance check
    config.set('complianceCheckRatio', 1)

    const res = await server.inject(options)

    expect(res.statusCode).toBe(StatusCodes.OK)
    const claim = JSON.parse(res.payload)
    expect(claim.status).toBe(STATUS.IN_CHECK)
    expect(claim.statusHistory).toEqual([
      {
        createdAt: expect.any(String),
        createdBy: 'admin',
        status: STATUS.IN_CHECK
      }
    ])
  })

  test('returns bad request when application does not exist', async () => {
    const res = await server.inject({
      ...options,
      payload: {
        ...options.payload,
        applicationReference: 'IAHW-G3CL-0000'
      }
    })

    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND)
    expect(JSON.parse(res.payload)).toEqual({
      error: 'Not Found',
      message: 'Application not found',
      statusCode: 404
    })
  })

  test('should return not authorised when no api key sent', async () => {
    const res = await server.inject({
      ...options,
      headers: {}
    })

    expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
  })

  test('should return not authorised when when api key incorrect', async () => {
    const res = await server.inject({
      ...options,
      headers: { 'x-api-key': 'will-not-be-this' }
    })

    expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
  })
})
