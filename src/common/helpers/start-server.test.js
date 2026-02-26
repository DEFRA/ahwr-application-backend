import { startServer } from './start-server.js'
import { createServer } from '../../server.js'
import { config } from '../../config/config.js'
import { runDistributedStartupJob } from '../../distributed-jobs/distributed-startup-job.js'

const mockLogger = { info: jest.fn(), error: jest.fn() }
const mockServer = { start: jest.fn(), logger: mockLogger }

jest.mock('../../server.js', () => ({
  createServer: jest.fn().mockImplementation(() => mockServer)
}))
jest.mock('../../config/config.js', () => ({
  config: {
    get: jest.fn()
  }
}))
jest.mock('../../messaging/fcp-messaging-service.js')
jest.mock('../../distributed-jobs/distributed-startup-job.js')

describe('startServer', () => {
  beforeEach(() => {
    config.get.mockReturnValue(3000)
    runDistributedStartupJob.mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create and start the server', async () => {
    const server = await startServer()

    expect(createServer).toHaveBeenCalledTimes(1)
    expect(mockServer.start).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith('Server started successfully')
    expect(mockLogger.info).toHaveBeenCalledWith('Access your backend on http://localhost:3000')
    expect(server).toBe(mockServer)
  })

  it('should throw an error if start fails', async () => {
    const testError = new Error('Failed to start server')
    mockServer.start.mockRejectedValueOnce(testError)

    await expect(startServer()).rejects.toThrow('Failed to start server')

    expect(createServer).toHaveBeenCalledTimes(1)
    expect(mockServer.start).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).not.toHaveBeenCalledWith('Server started successfully')
  })

  it('should create and start the server even when distributed startup job fails', async () => {
    runDistributedStartupJob.mockImplementation(() => Promise.reject(new Error('mock error')))

    const server = await startServer()

    expect(createServer).toHaveBeenCalledTimes(1)
    expect(mockServer.start).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith('Server started successfully')
    expect(mockLogger.info).toHaveBeenCalledWith('Access your backend on http://localhost:3000')
    expect(server).toBe(mockServer)

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Distributed startup job error',
      expect.any(Object)
    )
  })
})
