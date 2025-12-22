import {
  getOWApplication,
  updateOWApplicationStatus
} from '../../repositories/ow-application-repository'
import { applicationHandlers } from './applications'
import Hapi from '@hapi/hapi'
import { raiseApplicationStatusEvent } from '../../event-publisher'
import { ObjectId } from 'mongodb'

jest.mock('../../repositories/application-repository')
jest.mock('../../repositories/ow-application-repository')
jest.mock('../../event-publisher/claim-data-update-event')
jest.mock('../../event-publisher')

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

  server.route(applicationHandlers)

  await server.initialize()
  server.decorate('request', 'logger', mockLogger)
  server.decorate('request', 'db', mockDb)

  return server
}

describe('Applications test', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('PUT /api/applications/{ref} route', () => {
    test('returns 200 when new status is Withdrawn (2)', async () => {
      getOWApplication.mockResolvedValue({
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date(),
        data: {
          declaration: true
        },
        flags: [],
        status: 'AGREED'
      })
      updateOWApplicationStatus.mockResolvedValue({
        _id: new ObjectId('507f191e810c19729de860ea'),
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date('2025-03-02T08:46:19.637Z'),
        data: {
          declaration: true
        },
        flags: [],
        status: 'AGREED',
        updatedBy: 'test',
        updatedAt: new Date('2025-04-02T08:46:19.637Z')
      })

      const options = {
        method: 'PUT',
        url: '/api/applications/IAHW-U6ZE-5R5E',
        payload: { status: 'WITHDRAWN', user: 'test', note: 'reason' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateOWApplicationStatus).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'IAHW-U6ZE-5R5E',
        status: 'WITHDRAWN',
        user: 'test',
        updatedAt: expect.any(Date)
      })
      expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
        message: 'Application has been updated',
        application: {
          _id: new ObjectId('507f191e810c19729de860ea'),
          id: '507f191e810c19729de860ea',
          reference: 'IAHW-U6ZE-5R5E',
          createdBy: 'admin',
          createdAt: new Date('2025-03-02T08:46:19.637Z'),
          data: {
            declaration: true
          },
          flags: [],
          status: 'AGREED',
          updatedBy: 'test',
          updatedAt: new Date('2025-04-02T08:46:19.637Z')
        },
        raisedBy: 'test',
        raisedOn: new Date('2025-04-02T08:46:19.637Z'),
        note: 'reason'
      })
    })

    test('returns 200 when new status is In Check', async () => {
      getOWApplication.mockResolvedValue({
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date(),
        data: {
          declaration: true
        },
        flags: [],
        status: 'AGREED'
      })
      updateOWApplicationStatus.mockResolvedValue({
        _id: new ObjectId('507f191e810c19729de860ea'),
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date('2025-03-02T08:46:19.637Z'),
        data: {
          declaration: true
        },
        flags: [],
        status: 'IN_CHECK',
        updatedBy: 'test',
        updatedAt: new Date('2025-04-02T08:46:19.637Z')
      })

      const options = {
        method: 'PUT',
        url: '/api/applications/IAHW-U6ZE-5R5E',
        payload: { status: 'IN_CHECK', user: 'test', note: 'reason' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateOWApplicationStatus).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'IAHW-U6ZE-5R5E',
        status: 'IN_CHECK',
        user: 'test',
        updatedAt: expect.any(Date)
      })
      expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
        message: 'Application has been updated',
        application: {
          _id: new ObjectId('507f191e810c19729de860ea'),
          id: '507f191e810c19729de860ea',
          reference: 'IAHW-U6ZE-5R5E',
          createdBy: 'admin',
          createdAt: new Date('2025-03-02T08:46:19.637Z'),
          data: {
            declaration: true
          },
          flags: [],
          status: 'IN_CHECK',
          updatedBy: 'test',
          updatedAt: new Date('2025-04-02T08:46:19.637Z')
        },
        raisedBy: 'test',
        raisedOn: new Date('2025-04-02T08:46:19.637Z'),
        note: 'reason'
      })
    })

    test('returns 404 if application doesnt exist', async () => {
      getOWApplication.mockResolvedValue(undefined)

      const options = {
        method: 'PUT',
        url: '/api/applications/ABC-1234',
        payload: { status: 'IN_CHECK', user: 'test' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getOWApplication).toHaveBeenCalledTimes(1)
    })

    test.each([
      { status: 'abc', user: null },
      { status: 'abc', user: 0 },
      { status: 5000, user: 'test' }
    ])('returns 400 with error message for invalid input', async ({ status, user }) => {
      const options = {
        method: 'PUT',
        url: '/api/applications/ABC-1234',
        payload: { status, user }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })
})
