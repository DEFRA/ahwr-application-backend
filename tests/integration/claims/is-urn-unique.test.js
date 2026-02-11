import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'
import { owApplicationReviewClaim } from '../../data/ow-application-data.js'
import { reviewClaim } from '../../data/claim-data.js'

describe('Is URN Unique', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('applications').deleteMany({})
    await server.db.collection('owapplications').deleteMany({})
    await server.db.collection('claims').deleteMany({})

    await server.db.collection('applications').insertOne(application)
    await server.db.collection('owapplications').insertOne(owApplicationReviewClaim)
    await server.db.collection('claims').insertOne(reviewClaim)
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const options = {
    method: 'POST',
    url: '/api/claims/is-urn-unique',
    headers: { 'x-api-key': process.env.BACKOFFICE_UI_API_KEY }
  }

  test('returns urn is unique when urn does not exist on claims for sbi', async () => {
    const res = await server.inject({
      ...options,
      payload: {
        sbi: '123456789',
        laboratoryURN: '1353454'
      }
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      isURNUnique: true
    })
  })

  test('returns urn is not unique when urn exists on old world claim for sbi', async () => {
    const res = await server.inject({
      ...options,
      payload: {
        sbi: '123456789',
        laboratoryURN: '355981'
      }
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      isURNUnique: false
    })
  })

  test('returns urn is not unique when urn exists on claim for sbi', async () => {
    const res = await server.inject({
      ...options,
      payload: {
        sbi: '123456789',
        laboratoryURN: 'w5436346ret'
      }
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      isURNUnique: false
    })
  })
})
