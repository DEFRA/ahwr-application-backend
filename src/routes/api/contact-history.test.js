import { getApplicationsBySbi } from '../../repositories/application-repository.js'
import Hapi from '@hapi/hapi'
import { getOWApplicationsBySbi } from '../../repositories/ow-application-repository.js'
import {
  getAllByApplicationReference,
  updateApplicationValuesAndContactHistory
} from '../../repositories/contact-history-repository.js'
import { contactHistoryHandlers } from './contact-history.js'

jest.mock('../../repositories/contact-history-repository.js')
jest.mock('../../repositories/application-repository.js')
jest.mock('../../repositories/ow-application-repository.js')

const mockLogger = {
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  setBindings: jest.fn(() => {})
}
const mockDb = jest.fn()

const createServer = async () => {
  const server = Hapi.server({
    port: 0,
    host: 'localhost'
  })
  server.route(contactHistoryHandlers)

  await server.initialize()
  server.decorate('request', 'logger', mockLogger)
  server.decorate('request', 'db', mockDb)

  return server
}

describe('PUT /api/applications/contact-history handler', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const options = {
    method: 'PUT',
    url: '/api/applications/contact-history',
    payload: {
      user: 'admin',
      farmerName: 'John Farmer',
      orgEmail: 'orgEmail@somewhere.net',
      email: 'email@somewhere.net',
      address: '123 Farm Lane',
      crn: '0123456789',
      personRole: 'Agent',
      sbi: 123456789
    }
  }

  test('should return 404 when no application can be found', async () => {
    getApplicationsBySbi.mockResolvedValueOnce([])
    getOWApplicationsBySbi.mockResolvedValueOnce([])

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
  })

  test('should return 200 when no data changes', async () => {
    getApplicationsBySbi.mockResolvedValueOnce([
      {
        organisation: {
          sbi: '123456789',
          farmerName: 'John Farmer',
          orgEmail: 'orgEmail@somewhere.net',
          email: 'email@somewhere.net',
          address: '123 Farm Lane',
          crn: '0123456789'
        }
      }
    ])
    getOWApplicationsBySbi.mockResolvedValueOnce([])

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateApplicationValuesAndContactHistory).not.toHaveBeenCalled()
  })

  test('should return 200 and update the application when data has changed', async () => {
    getApplicationsBySbi.mockResolvedValueOnce([
      {
        reference: 'IAHW-JTTU-SDQ7',
        organisation: {
          sbi: '123456789',
          farmerName: 'Jane Farmer',
          orgEmail: 'orgEmail@nowhere.net',
          email: 'email@nowhere.net',
          address: '456 Farm Lane'
        }
      }
    ])
    getOWApplicationsBySbi.mockResolvedValueOnce([])

    const res = await server.inject(options)

    expect(updateApplicationValuesAndContactHistory).toHaveBeenCalledWith({
      collection: 'applications',
      db: mockDb,
      reference: 'IAHW-JTTU-SDQ7',
      contactHistory: [
        {
          createdAt: expect.any(Date),
          crn: '0123456789',
          field: 'email',
          newValue: 'email@somewhere.net',
          oldValue: 'email@nowhere.net',
          personRole: 'Agent'
        },
        {
          createdAt: expect.any(Date),
          crn: '0123456789',
          field: 'orgEmail',
          newValue: 'orgEmail@somewhere.net',
          oldValue: 'orgEmail@nowhere.net',
          personRole: 'Agent'
        },
        {
          createdAt: expect.any(Date),
          crn: '0123456789',
          field: 'address',
          newValue: '123 Farm Lane',
          oldValue: '456 Farm Lane',
          personRole: 'Agent'
        },
        {
          createdAt: expect.any(Date),
          crn: '0123456789',
          field: 'farmerName',
          newValue: 'John Farmer',
          oldValue: 'Jane Farmer',
          personRole: 'Agent'
        }
      ],
      updatedBy: 'admin',
      updatedPropertyPathsAndValues: {
        'organisation.address': '123 Farm Lane',
        'organisation.crn': '0123456789',
        'organisation.email': 'email@somewhere.net',
        'organisation.farmerName': 'John Farmer',
        'organisation.orgEmail': 'orgEmail@somewhere.net'
      }
    })
    expect(res.statusCode).toBe(200)
  })

  test('should return 200 and update multiple applications when data has changed', async () => {
    getApplicationsBySbi.mockResolvedValueOnce([
      {
        reference: 'IAHW-JTTU-SDQ7',
        organisation: {
          sbi: '123456789',
          farmerName: 'Jane Farmer',
          orgEmail: 'orgEmail@somewhere.net',
          email: 'email@somewhere.net',
          address: '123 Farm Lane'
        }
      }
    ])
    getOWApplicationsBySbi.mockResolvedValueOnce([
      {
        reference: 'AHWR-JTTU-SDQ7',
        organisation: {
          sbi: '123456789',
          farmerName: 'Jane Farmer',
          orgEmail: 'orgEmail@somewhere.net',
          email: 'email@somewhere.net',
          address: '123 Farm Lane'
        }
      }
    ])

    const res = await server.inject(options)

    expect(updateApplicationValuesAndContactHistory).toHaveBeenCalledWith({
      collection: 'applications',
      db: mockDb,
      reference: 'IAHW-JTTU-SDQ7',
      contactHistory: [
        {
          createdAt: expect.any(Date),
          crn: '0123456789',
          field: 'farmerName',
          newValue: 'John Farmer',
          oldValue: 'Jane Farmer',
          personRole: 'Agent'
        }
      ],
      updatedBy: 'admin',
      updatedPropertyPathsAndValues: {
        'organisation.crn': '0123456789',
        'organisation.farmerName': 'John Farmer'
      }
    })
    expect(updateApplicationValuesAndContactHistory).toHaveBeenCalledWith({
      collection: 'owapplications',
      db: mockDb,
      reference: 'AHWR-JTTU-SDQ7',
      contactHistory: [
        {
          createdAt: expect.any(Date),
          crn: '0123456789',
          field: 'farmerName',
          newValue: 'John Farmer',
          oldValue: 'Jane Farmer',
          personRole: 'Agent'
        }
      ],
      updatedBy: 'admin',
      updatedPropertyPathsAndValues: {
        'organisation.crn': '0123456789',
        'organisation.farmerName': 'John Farmer'
      }
    })
    expect(res.statusCode).toBe(200)
  })

  test('should return 200 and update the application with CRN when nothing changed but CRN missing', async () => {
    getApplicationsBySbi.mockResolvedValueOnce([])
    getOWApplicationsBySbi.mockResolvedValueOnce([
      {
        reference: 'AHWR-JTTU-SDQ7',
        organisation: {
          sbi: '123456789',
          farmerName: 'John Farmer',
          orgEmail: 'orgEmail@somewhere.net',
          email: 'email@somewhere.net',
          address: '123 Farm Lane'
        }
      }
    ])

    const res = await server.inject(options)

    expect(updateApplicationValuesAndContactHistory).toHaveBeenCalledWith({
      collection: 'owapplications',
      db: mockDb,
      reference: 'AHWR-JTTU-SDQ7',
      contactHistory: [],
      updatedBy: 'admin',
      updatedPropertyPathsAndValues: {
        'organisation.crn': '0123456789'
      }
    })
    expect(res.statusCode).toBe(200)
  })

  test('should return 400 when payload is invalid', async () => {
    const res = await server.inject({
      ...options,
      payload: {
        user: 'admin',
        farmerName: 'John Farmer',
        address: '123 Farm Lane',
        crn: '0123456789',
        personRole: 'Agent',
        sbi: 123456789
      }
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/applications/contact-history/{REF} handler', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const options = {
    method: 'GET',
    url: '/api/applications/contact-history/{REF}'
  }

  test('should return 200 and an empty array when no application history can be found', async () => {
    getAllByApplicationReference.mockResolvedValueOnce(null)

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual('[]')
  })

  test('should return 200 and an empty array when no application history can be found', async () => {
    getAllByApplicationReference.mockResolvedValueOnce({ contactHistory: null })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual('[]')
  })

  test('should return 200 and array of results when application contact history found', async () => {
    getAllByApplicationReference.mockResolvedValueOnce({
      contactHistory: [
        {
          oldValue: 'email@somewhere.net',
          newValue: 'email@nowhere.net',
          field: 'email'
        }
      ]
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual(
      JSON.stringify([
        {
          oldValue: 'email@somewhere.net',
          newValue: 'email@nowhere.net',
          field: 'email'
        }
      ])
    )
  })
})
