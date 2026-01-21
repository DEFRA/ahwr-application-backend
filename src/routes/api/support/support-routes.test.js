import { Server } from '@hapi/hapi'
import { supportHandlers } from './support-routes'
import { applicationDocument, claimDocument, herdDocument } from './test-data'

const reference = 'REBC-VA4R-TRL7'
const mockLogger = {
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  setBindings: jest.fn(() => {})
}

const mockFindOne = jest.fn()
const mockDb = {
  collection: jest.fn(() => ({
    findOne: mockFindOne
  }))
}

describe('support-routes', () => {
  let server

  beforeAll(async () => {
    server = new Server()
    server.route(supportHandlers)
    server.decorate('request', 'logger', mockLogger)
    server.decorate('request', 'db', mockDb)
    await server.initialize()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Get /api/support/application', () => {
    it('returns the data if present', async () => {
      const mockResult = applicationDocument({ reference })
      mockFindOne.mockResolvedValue(mockResult)
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/application/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ reference })
      expect(response.statusCode).toBe(200)
      expect(response.result).toEqual(mockResult)
    })

    it('returns not found if not present', async () => {
      mockFindOne.mockResolvedValue(null)
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/application/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ reference })
      expect(response.statusCode).toBe(404)
      expect(response.result).toEqual({
        error: 'Not Found',
        message: 'Application not found',
        statusCode: 404
      })
    })

    it('handles an error from the DB', async () => {
      mockFindOne.mockImplementation(() => {
        throw new Error('Database error')
      })
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/application/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ reference })
      expect(response.statusCode).toBe(500)
      expect(response.result).toEqual({
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        statusCode: 500
      })
    })
  })

  describe('Get /api/support/claim', () => {
    it('returns the data if present', async () => {
      const mockResult = claimDocument
      mockFindOne.mockResolvedValue(mockResult)
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/claim/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ reference }, { projection: { _id: 0 } })
      expect(response.statusCode).toBe(200)
      expect(response.result).toEqual(mockResult)
    })

    it('returns not found if not present', async () => {
      mockFindOne.mockResolvedValue(null)
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/claim/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ reference }, { projection: { _id: 0 } })
      expect(response.statusCode).toBe(404)
      expect(response.result).toEqual({
        error: 'Not Found',
        message: 'Claim not found',
        statusCode: 404
      })
    })

    it('handles an error from the DB', async () => {
      mockFindOne.mockImplementation(() => {
        throw new Error('Database error')
      })
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/claim/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ reference }, { projection: { _id: 0 } })
      expect(response.statusCode).toBe(500)
      expect(response.result).toEqual({
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        statusCode: 500
      })
    })
  })

  describe('Get /api/support/herd', () => {
    it('returns the data if present', async () => {
      const mockResult = herdDocument
      mockFindOne.mockResolvedValue(mockResult)
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/herd/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ id: reference, isCurrent: true })
      expect(response.statusCode).toBe(200)
      expect(response.result).toEqual(mockResult)
    })

    it('returns not found if not present', async () => {
      mockFindOne.mockResolvedValue(null)
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/herd/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ id: reference, isCurrent: true })
      expect(response.statusCode).toBe(404)
      expect(response.result).toEqual({
        error: 'Not Found',
        message: 'Herd not found',
        statusCode: 404
      })
    })

    it('handles an error from the DB', async () => {
      mockFindOne.mockImplementation(() => {
        throw new Error('Database error')
      })
      const response = await server.inject({
        method: 'GET',
        url: `/api/support/herd/${reference}`
      })

      expect(mockFindOne).toHaveBeenCalledWith({ id: reference, isCurrent: true })
      expect(response.statusCode).toBe(500)
      expect(response.result).toEqual({
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
        statusCode: 500
      })
    })
  })
})
