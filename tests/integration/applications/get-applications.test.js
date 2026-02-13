import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

describe('Get applications', () => {
  let server
  let options

  beforeAll(async () => {
    server = await setupTestEnvironment()
    options = {
      method: 'GET',
      url: '/api/applications',
      headers: { 'x-api-key': config.get('apiKeys.backofficeUiApiKey') }
    }
  })

  beforeEach(async () => {
    await server.db.collection('applications').deleteMany({})
    await server.db.collection('owapplications').deleteMany({})
    await server.db.collection('applications').insertOne(application)
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  test('successfully retrieves applications for a given sbi', async () => {
    const res = await server.inject({
      ...options,
      url: `${options.url}?sbi=123456789`
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual([
      {
        type: 'EE',
        reference: 'IAHW-G3CL-V59P',
        data: {
          reference: 'TEMP-AAAA-AAAA',
          declaration: true,
          offerStatus: 'accepted',
          confirmCheckDetails: 'yes'
        },
        status: 'AGREED',
        createdAt: expect.any(String),
        organisation: {
          name: 'Fake org name',
          farmerName: 'Fake farmer name',
          email: 'fake.farmer.email@example.com.test',
          sbi: '123456789',
          address: '1 fake street,fake town,United Kingdom',
          orgEmail: 'fake.org.email@example.com.test'
        },
        redacted: false,
        flags: []
      }
    ])
  })

  test('returns no applications when sbi does not match', async () => {
    const res = await server.inject({
      ...options,
      url: `${options.url}?sbi=111111111`
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual([])
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
