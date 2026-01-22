import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { reviewClaim } from '../../data/claim-data.js'

describe('Get claim', () => {
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

  test('returns claim when claim reference matches claim in db', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/support/claims/REBC-VA4R-TRL7'
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      applicationReference: 'IAHW-G3CL-V59P',
      createdAt: '2025-04-24T08:24:24.092Z',
      createdBy: 'admin',
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
        },
        {
          createdAt: '2025-04-25T13:35:43.530Z',
          createdBy: 'Carroll, Aaron',
          eventType: 'claim-dateOfVisit',
          id: '2e468208-1f07-46c3-a032-885d5868bd3d',
          newValue: '2025-04-25T00:00:00.000Z',
          note: 'Updated date',
          oldValue: '2025-04-24T00:00:00.000Z',
          updatedProperty: 'dateOfVisit'
        },
        {
          createdAt: '2025-04-28T07:44:06.944Z',
          createdBy: 'Carroll, Aaron',
          eventType: 'claim-vetRCVSNumber',
          id: '0dd471c3-3d22-4093-83d2-ab549bd65a59',
          newValue: '1111111',
          note: 'updated for checking',
          oldValue: '5312363',
          updatedProperty: 'vetRCVSNumber'
        }
      ],
      updatedAt: '2025-04-28T07:44:03.864Z',
      updatedBy: null
    })
  })
})
