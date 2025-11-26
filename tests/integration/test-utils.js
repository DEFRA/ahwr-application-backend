import { startServer } from '../../src/common/helpers/start-server.js'

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
  server = await startServer()
  return server
}

export const teardownTestEnvironment = async () => {
  if (server) {
    await server.stop()
  }
}
