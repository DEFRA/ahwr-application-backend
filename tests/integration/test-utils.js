import { config } from '../../src/config/config.js'
import { createServer } from '../../src/server.js'

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
  return server
}

export const teardownTestEnvironment = async () => {
  if (server) {
    await server.stop()
  }
}
