import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'

describe('Create application', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const options = {
    method: 'POST',
    url: '/api/applications',
    payload: {
      reference: 'TEMP-5C1C-DD6Z',
      confirmCheckDetails: 'yes',
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'Mr Farmer',
        name: 'My Amazing Farm',
        sbi: '118409263',
        cph: '123/456/789',
        crn: '112223',
        address: '1 Example Road',
        email: 'business@email.com',
        userType: 'newUser'
      }
    }
  }

  test('successfully creates a new application', async () => {
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      applicationReference: 'IAHW-5C1C-DD6Z'
    })
  })
})
