import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

const { backofficeUiApiKey } = config.get('apiKeys')

jest.mock('../../../src/event-publisher/index.js') //TODO remove mock

describe('Create application', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('applications').deleteMany({})
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
        sbi: '123456789',
        address: '1 Example Road',
        email: 'business@email.com',
        userType: 'newUser'
      }
    },
    headers: { 'x-api-key': backofficeUiApiKey }
  }

  test('successfully creates a new application', async () => {
    const res = await server.inject(options)

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({
      applicationReference: 'IAHW-5C1C-DD6Z'
    })
  })

  test('successfully creates a new application with optional fields', async () => {
    const fullOrganisation = {
      ...options.payload.organisation,
      orgEmail: 'org@email.com',
      cph: '123/456/789',
      crn: '1122231254',
      frn: '987654321',
      id: '1234566'
    }
    const res = await server.inject({
      ...options,
      payload: { ...options.payload, organisation: fullOrganisation }
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({
      applicationReference: 'IAHW-5C1C-DD6Z'
    })
  })

  test('returns error when validation fails as missing required property', async () => {
    const res = await server.inject({
      ...options,
      payload: { ...options.payload, offerStatus: undefined }
    })

    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(JSON.parse(res.payload)).toEqual({
      error: 'Bad Request',
      message: '"offerStatus" is required',
      statusCode: 400
    })
  })

  test('returns error when active application already exists for sbi', async () => {
    await server.db.collection('applications').insertOne(application)

    const res = await server.inject(options)

    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(JSON.parse(res.payload)).toEqual({
      error: 'Internal Server Error',
      message: 'An internal server error occurred',
      statusCode: 500
    })
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
