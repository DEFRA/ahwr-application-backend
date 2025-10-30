import { createServer } from '../../src/server.js'

let server

export const setupTestEnvironment = async () => {
  server = await createServer()

  return server
}

export const teardownTestEnvironment = async () => {
  if (server) {
    await server.stop()
  }
}
