import { startServer } from '../../src/common/helpers/start-server.js'

jest.mock('ffc-ahwr-common-library', () => {
  const actual = jest.requireActual('ffc-ahwr-common-library')
  return {
    ...actual,
    createEventPublisher: () => ({
      publishEvent: jest.fn(),
      publishEvents: jest.fn()
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
