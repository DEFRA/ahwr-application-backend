import { config } from '../../src/config/config.js'
import { createServer } from '../../src/server.js'
import { startFcpMessagingService } from '../../src/messaging/fcp-messaging-service.js'
import { getLogger } from '../../src/logging/logger.js'

jest.mock('../../src/scheduled/cron-scheduler.js', () => ({
  startPulseScheduling: jest.fn(),
  stopPulseScheduling: jest.fn()
}))

jest.mock('ffc-ahwr-common-library', () => {
  const actual = jest.requireActual('ffc-ahwr-common-library')
  return {
    ...actual,
    createServiceBusClient: () => ({
      close: jest.fn()
    }),
    createEventPublisher: () => ({
      publishEvent: jest.fn(),
      publishEvents: jest.fn()
    }),
    SqsSubscriber: () => ({
      start: jest.fn(),
      stop: jest.fn()
    })
  }
})

let server

export const setupTestEnvironment = async () => {
  config.set('apiKeys.backofficeUiApiKey', 'test-backoffice-ui-api-key')
  server = await createServer()
  // server.inject() doesn't fire the 'start' event, so initialise the FCP
  // publisher here. The Service Bus boundary is stubbed via the
  // ffc-ahwr-common-library mock above, so this runs the real event-publisher
  // code against a no-op publisher rather than mocking within-system modules.
  await startFcpMessagingService(getLogger())
  return server
}

export const teardownTestEnvironment = async () => {
  if (server) {
    await server.stop()
  }
}
