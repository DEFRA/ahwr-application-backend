import { getApplication } from '../../repositories/application-repository'
import Hapi from '@hapi/hapi'
import { latestContactDetailsHandlers } from './latest-contact-details'

jest.mock('../../repositories/application-repository')

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

  server.route(latestContactDetailsHandlers)

  await server.initialize()
  server.decorate('request', 'logger', mockLogger)
  server.decorate('request', 'db', mockDb)

  return server
}

describe('latest-contact-details', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('GET /api/applications/latest-contact-details', () => {
    test('should return contact details when reference matches an application with contact details', async () => {
      getApplication.mockResolvedValue({
        reference: 'TEMP-MFV1-AAAA',
        createdBy: 'admin',
        createdAt: new Date('2025-01-01'),
        organisation: {
          sbi: '106642000',
          name: 'Willow Farm',
          email: 'john.doe@gmail.com',
          address: 'Sunnybrook Farm, 123 Harvest Lane, Meadowville, Oxfordshire, OX12 3AB, UK',
          orgEmail: 'willowfarm@gmail.com',
          userType: 'newUser',
          farmerName: 'John Jim Doe'
        },
        data: {
          reference: 'TEMP-MFV1-AAAA',
          declaration: true,
          offerStatus: 'accepted',
          confirmCheckDetails: 'yes'
        }
      })

      const options = {
        method: 'GET',
        url: '/api/applications/latest-contact-details/TEMP-MFV1-AAAA'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.payload)).toEqual({
        name: 'Willow Farm',
        orgEmail: 'willowfarm@gmail.com',
        farmerName: 'John Jim Doe',
        email: 'john.doe@gmail.com'
      })
    })

    test('should return empty contact details when reference matches an application without contact details', async () => {
      getApplication.mockResolvedValueOnce({
        reference: 'TEMP-MFV1-AAAA',
        createdBy: 'admin',
        createdAt: new Date('2025-01-01'),
        organisation: {
          sbi: '106642000',
          address: 'Sunnybrook Farm, 123 Harvest Lane, Meadowville, Oxfordshire, OX12 3AB, UK',
          userType: 'newUser'
        },
        data: {
          reference: 'TEMP-MFV1-AAAA',
          declaration: true,
          offerStatus: 'accepted',
          confirmCheckDetails: 'yes'
        }
      })

      const options = {
        method: 'GET',
        url: '/api/applications/latest-contact-details/TEMP-MFV1-AAAA'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.payload)).toEqual({})
    })

    test('should return 404 when reference does not match an application', async () => {
      getApplication.mockResolvedValueOnce(null)

      const options = {
        method: 'GET',
        url: '/api/applications/latest-contact-details/TEMP-MFV1-AAAA'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getApplication).toHaveBeenCalledWith({ db: mockDb, reference: 'TEMP-MFV1-AAAA' })
    })
  })
})
