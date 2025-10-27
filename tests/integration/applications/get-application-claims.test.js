import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { reviewClaim } from '../../data/claim-data.js'

describe('Get application claims', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('claims').deleteMany({})
    await server.db.collection('claims').insertOne(reviewClaim)
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const buildUrl = (appRef, typeOfLivestock) =>
    `/api/applications/${appRef}/claims?typeOfLivestock=${typeOfLivestock}`

  test('successfully retrieves claims for a given application and livestock', async () => {
    const res = await server.inject({
      method: 'GET',
      url: buildUrl('IAHW-G3CL-V59P', 'beef')
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual([
      {
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
        type: 'REVIEW'
      }
    ])
  })

  test('returns no claims when an application has no claims for livestock', async () => {
    const res = await server.inject({
      method: 'GET',
      url: buildUrl('IAHW-G3CL-V59P', 'sheep')
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual([])
  })
})
