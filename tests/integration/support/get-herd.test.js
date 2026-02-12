import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { beefHerdVersion1, beefHerdVersion2 } from '../../data/herd-data.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

const { backofficeUiApiKey } = config.get('apiKeys')

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

  const options = {
    method: 'GET',
    url: '/api/support/herds/0e4f55ea-ed42-4139-9c46-c75ba63b0742',
    headers: { 'x-api-key': backofficeUiApiKey }
  }

  test('successfully retrieves herd', async () => {
    const res = await server.inject(options)

    expect(res.statusCode).toBe(StatusCodes.OK)
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
