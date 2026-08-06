import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { beefHerd, sheepHerd } from '../../data/herd-data.js'
import { beefClaimWithHerd, withdrawnSheepClaimWithHerd } from '../../data/claim-data.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

describe('Get application herds', () => {
  let server
  let options

  beforeAll(async () => {
    server = await setupTestEnvironment()
    options = {
      method: 'GET',
      url: buildUrl('IAHW-G3CL-V59P', 'beef'),
      headers: { 'x-api-key': config.get('apiKeys.backofficeUiApiKey') }
    }
  })

  beforeEach(async () => {
    await server.db.collection('herds').deleteMany({})
    await server.db.collection('herds').insertMany([beefHerd, sheepHerd])
    await server.db.collection('claims').deleteMany({})
    await server.db
      .collection('claims')
      .insertMany([beefClaimWithHerd, withdrawnSheepClaimWithHerd])
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const buildUrl = (appRef, species) => `/api/applications/${appRef}/herds?species=${species}`

  test('successfully retrieves herds for a given application and species', async () => {
    const res = await server.inject(options)

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({
      herds: [
        {
          id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
          version: 1,
          name: 'EventTester',
          cph: '12/345/6789',
          reasons: ['separateManagementNeeds'],
          species: 'beef'
        }
      ]
    })
  })

  test('excludes herds whose only claims are withdrawn by default', async () => {
    const res = await server.inject({
      ...options,
      url: buildUrl('IAHW-G3CL-V59P', 'sheep')
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({ herds: [] })
  })

  test('includes herds whose only claims are withdrawn when includeWithdrawns is true', async () => {
    const res = await server.inject({
      ...options,
      url: `${buildUrl('IAHW-G3CL-V59P', 'sheep')}&includeWithdrawns=true`
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({
      herds: [
        {
          id: '40ba22b3-cfdc-4d8c-b491-13873ec97439',
          version: 1,
          name: 'Sheep herd 1',
          cph: '44/323/4441',
          reasons: ['onlyHerd'],
          species: 'sheep'
        }
      ]
    })
  })

  test('returns no herds when an application has no herds for species', async () => {
    const res = await server.inject({
      ...options,
      url: buildUrl('IAHW-G3CL-V59P', 'pigs')
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({ herds: [] })
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

  test('accepts poultry as a valid species', async () => {
    const res = await server.inject({
      ...options,
      url: buildUrl('IAHW-G3CL-V59P', 'poultry')
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
  })

  test('rejects individual poultry types as invalid species', async () => {
    const res = await server.inject({
      ...options,
      url: buildUrl('IAHW-G3CL-V59P', 'broilers')
    })

    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
  })
})
