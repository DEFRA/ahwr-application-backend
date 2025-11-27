import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { beefHerd, sheepHerd } from '../../data/herd-data.js'

describe('Get application herds', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('herds').deleteMany({})
    await server.db.collection('herds').insertMany([beefHerd, sheepHerd])
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const buildUrl = (appRef, species) => `/api/applications/${appRef}/herds?species=${species}`

  test('successfully retrieves herds for a given application and species', async () => {
    const res = await server.inject({
      method: 'GET',
      url: buildUrl('IAHW-G3CL-V59P', 'beef')
    })

    expect(res.statusCode).toBe(200)
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

  test('returns no herds when an application has no herds for species', async () => {
    const res = await server.inject({
      method: 'GET',
      url: buildUrl('IAHW-G3CL-V59P', 'pigs')
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ herds: [] })
  })
})
