import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'

describe('Create claim', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('applications').deleteMany({})
    await server.db.collection('claims').deleteMany({})

    await server.db.collection('applications').insertOne(application)
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const options = {
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
    }
  }

  test('successfully creates a new claim with herd', async () => {
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      applicationReference: 'IAHW-G3CL-V59P',
      createdBy: 'admin',
      data: {
        amount: 4,
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
      status: expect.any(String), // TODO: Depending on how/where this runs it's either ON_HOLD or IN_CHECK, sort this out when doing compliance check stuff
      type: 'REVIEW'
    })
  })

  test('returns bad request when application does not exist', async () => {
    const res = await server.inject({
      ...options,
      payload: {
        ...options.payload,
        applicationReference: 'IAHW-G3CL-0000'
      }
    })

    expect(res.statusCode).toBe(404)
    expect(JSON.parse(res.payload)).toEqual({
      error: 'Not Found',
      message: 'Application not found',
      statusCode: 404
    })
  })
})
