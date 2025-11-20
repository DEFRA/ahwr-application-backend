import { findApplication } from '../../repositories/application-repository.js'
import {
  getClaimByReference,
  updateClaimData
} from '../../repositories/claim-repository.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'
import Hapi from '@hapi/hapi'
import { claimsHandlers } from './claims.js'

jest.mock('../../repositories/claim-repository.js')
jest.mock('../../repositories/application-repository.js')
jest.mock('../../event-publisher/claim-data-update-event.js')

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
  server.route(claimsHandlers)

  await server.initialize()
  server.decorate('request', 'logger', mockLogger)
  server.decorate('request', 'db', mockDb)

  return server
}

describe('PUT /api/claims/{reference}/data handler', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const options = {
    method: 'PUT',
    url: '/api/claims/FUBC-JTTU-SDQ7/data',
    payload: { vetsName: 'New Vet', user: 'tester', note: 'Changed vet name' }
  }

  test('should return 404 when claim is not found', async () => {
    getClaimByReference.mockResolvedValue(null)

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
  })

  test('should return 204 when no data changes', async () => {
    getClaimByReference.mockResolvedValue({
      data: { vetsName: 'New Vet' }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(204)
    expect(updateClaimData).not.toHaveBeenCalled()
    expect(claimDataUpdateEvent).not.toHaveBeenCalled()
  })

  test('should return 204 and update the claim when data has changed', async () => {
    getClaimByReference.mockResolvedValue({
      data: { vetsName: 'Old Vet' },
      applicationReference: 'IAHW-G3CL-V59P'
    })
    updateClaimData.mockResolvedValue({
      applicationReference: 'IAHW-G3CL-V59P'
    })
    findApplication.mockResolvedValue({
      organisation: { sbi: '123456789' }
    })

    const res = await server.inject(options)

    expect(updateClaimData).toHaveBeenCalledWith({
      db: mockDb,
      reference: 'FUBC-JTTU-SDQ7',
      updatedProperty: 'vetsName',
      newValue: 'New Vet',
      oldValue: 'Old Vet',
      note: 'Changed vet name',
      user: 'tester',
      updatedAt: expect.any(Date)
    })
    expect(claimDataUpdateEvent).toHaveBeenCalledWith(
      {
        applicationReference: 'IAHW-G3CL-V59P',
        reference: 'FUBC-JTTU-SDQ7',
        updatedProperty: 'vetsName',
        newValue: 'New Vet',
        oldValue: 'Old Vet',
        note: 'Changed vet name'
      },
      'claim-vetName',
      'tester',
      expect.any(Date),
      '123456789'
    )
    expect(res.statusCode).toBe(204)
  })

  test('should return 400 when payload is invalid', async () => {
    const res = await server.inject({
      ...options,
      payload: { note: 'Test' }
    })

    expect(res.statusCode).toBe(400)
  })

  test('should return 400 when payload does not contain a claim property to update', async () => {
    const res = await server.inject({
      ...options,
      payload: { note: 'Test', user: 'Developer' }
    })

    expect(res.statusCode).toBe(400)
  })
})
