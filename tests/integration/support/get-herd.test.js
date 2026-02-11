import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { beefHerdVersion1, beefHerdVersion2 } from '../../data/herd-data.js'

describe('Get application herds', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('herds').deleteMany({})
    await server.db.collection('herds').insertMany([beefHerdVersion1, beefHerdVersion2])
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  test('successfully retrieves herd', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/support/herds/0e4f55ea-ed42-4139-9c46-c75ba63b0742',
      headers: { 'x-api-key': process.env.BACKOFFICE_UI_API_KEY }
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual([
      {
        _id: expect.any(String),
        applicationReference: 'IAHW-G3CL-V59P',
        createdAt: '2025-08-15T08:54:04.271Z',
        createdBy: 'admin',
        isCurrent: false,
        id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
        version: 1,
        name: 'EventTester',
        cph: '12/345/6789',
        reasons: ['separateManagementNeeds'],
        species: 'beef'
      },
      {
        _id: expect.any(String),
        applicationReference: 'IAHW-G3CL-V59P',
        createdAt: '2025-08-15T08:54:04.271Z',
        createdBy: 'admin',
        isCurrent: true,
        id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
        version: 2,
        name: 'EventTester',
        cph: '12/345/6789',
        reasons: ['separateManagementNeeds'],
        species: 'beef'
      }
    ])
  })
})
