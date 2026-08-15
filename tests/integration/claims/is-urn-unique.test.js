import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'
import { owApplicationReviewClaim } from '../../data/ow-application-data.js'
import { reviewClaim } from '../../data/claim-data.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

describe('Is URN Unique', () => {
  let server
  let options

  beforeAll(async () => {
    server = await setupTestEnvironment()
    options = {
      method: 'POST',
      url: '/api/claims/is-urn-unique',
      headers: { 'x-api-key': config.get('apiKeys.backofficeUiApiKey') }
    }
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

  test.each([
    {
      description: 'urn does not exist on claims for sbi',
      laboratoryURN: '1353454',
      isURNUnique: true
    },
    {
      description: 'urn exists on old world claim for sbi',
      laboratoryURN: '355981',
      isURNUnique: false
    },
    {
      description: 'urn exists on claim for sbi',
      laboratoryURN: 'w5436346ret',
      isURNUnique: false
    }
  ])(
    'returns isURNUnique $isURNUnique when $description',
    async ({ laboratoryURN, isURNUnique }) => {
      const res = await server.inject({
        ...options,
        payload: {
          sbi: '123456789',
          laboratoryURN
        }
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(JSON.parse(res.payload)).toEqual({
        isURNUnique
      })
    }
  )

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
