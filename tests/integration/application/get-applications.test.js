import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'

describe('Get applications', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const options = {
    method: 'GET',
    url: '/api/applications'
  }

  test('successfully retrieves applications for a given sbi', async () => {
    await server.db.collection('applications').insertOne(application)

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
        redacted: false
      }
    ])
  })
})
