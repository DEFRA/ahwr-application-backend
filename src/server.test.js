import { createServer } from './server.js'
import { config } from './config/config.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import {
  configureAndStartMessaging,
  stopMessageSubscriber
} from './messaging/application-message-queue-subscriber.js'
import {
  startFcpMessagingService,
  stopFcpMessagingService
} from './messaging/fcp-messaging-service.js'
import { startPulseScheduling, stopPulseScheduling } from './scheduled/cron-scheduler.js'
import { getLogger } from './logging/logger.js'
import { runDistributedStartupJobInBackground } from './distributed-jobs/distributed-startup-job.js'

function mockPlugin(name, decorate) {
  return {
    name,
    register: (server) => decorate?.(server)
  }
}

jest.mock('./config/config.js', () => ({
  config: { get: jest.fn() }
}))
jest.mock('./common/helpers/proxy/setup-proxy.js')
jest.mock('./plugins/router.js', () => ({ router: { plugin: mockPlugin('router') } }))
jest.mock('./plugins/auth.js', () => ({ authPlugin: { plugin: mockPlugin('auth') } }))
jest.mock('./logging/request-logger.js', () => ({
  requestLogger: { plugin: mockPlugin('request-logger') }
}))
jest.mock('./common/helpers/request-tracing.js', () => ({
  requestTracing: { plugin: mockPlugin('request-tracing') }
}))
jest.mock('./common/helpers/pulse.js', () => ({ pulse: { plugin: mockPlugin('pulse') } }))
jest.mock('@defra/hapi-secure-context', () => ({
  secureContext: { plugin: mockPlugin('secure-context') }
}))
jest.mock('./common/helpers/mongodb.js', () => ({
  mongoDb: mockPlugin('mongodb', (server) => server.decorate('server', 'db', 'mock-db'))
}))
jest.mock('./messaging/application-message-queue-subscriber.js', () => ({
  configureAndStartMessaging: jest.fn(),
  stopMessageSubscriber: jest.fn()
}))
jest.mock('./messaging/fcp-messaging-service.js', () => ({
  startFcpMessagingService: jest.fn(),
  stopFcpMessagingService: jest.fn()
}))
jest.mock('./scheduled/cron-scheduler.js', () => ({
  startPulseScheduling: jest.fn(),
  stopPulseScheduling: jest.fn()
}))
jest.mock('./logging/logger.js', () => ({ getLogger: jest.fn() }))
jest.mock('./distributed-jobs/distributed-startup-job.js', () => ({
  runDistributedStartupJobInBackground: jest.fn()
}))

const configValues = {
  host: 'localhost',
  port: 3001,
  mongo: { mongoUrl: 'mongodb://localhost' }
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

describe('createServer', () => {
  const mockLogger = { info: jest.fn() }
  let server

  beforeEach(() => {
    config.get.mockImplementation((key) => configValues[key])
    getLogger.mockReturnValue(mockLogger)
  })

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('creates a server using the configured host and port', async () => {
    server = await createServer()

    expect(setupProxy).toHaveBeenCalled()
    expect(server.settings.host).toBe('localhost')
    expect(server.settings.port).toBe(3001)
    expect(server.settings.router.stripTrailingSlash).toBe(true)
    expect(server.settings.routes.validate.options.abortEarly).toBe(false)
  })

  it('registers all plugins', async () => {
    server = await createServer()

    expect(Object.keys(server.registrations)).toEqual([
      'request-logger',
      'request-tracing',
      'secure-context',
      'pulse',
      'mongodb',
      'auth',
      'router'
    ])
  })

  it('uses the test port when provided', async () => {
    server = await createServer({ testPort: 4000 })

    expect(server.settings.port).toBe(4000)
  })

  it('starts scheduling, messaging and startup jobs when the server starts', async () => {
    server = await createServer({ testPort: 0 })

    await server.start()
    await flushPromises()

    expect(startPulseScheduling).toHaveBeenCalledWith('mock-db')
    expect(startFcpMessagingService).toHaveBeenCalledWith(mockLogger)
    expect(runDistributedStartupJobInBackground).toHaveBeenCalledWith('mock-db', mockLogger)
    expect(configureAndStartMessaging).toHaveBeenCalledWith('mock-db')
  })

  it('stops messaging and scheduling when the server stops', async () => {
    server = await createServer({ testPort: 0 })

    await server.start()
    await server.stop()
    await flushPromises()

    expect(stopMessageSubscriber).toHaveBeenCalled()
    expect(stopFcpMessagingService).toHaveBeenCalled()
    expect(stopPulseScheduling).toHaveBeenCalled()
  })
})
