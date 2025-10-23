import { MongoMemoryServer } from 'mongodb-memory-server'
import { createServer } from '../../src/server.js'
import { config } from '../../src/config.js'

let mongod
let server

export const setupTestEnvironment = async () => {
  const dbName = 'testdb'

  mongod = await MongoMemoryServer.create({
    instance: {
      dbName
    },
    binary: {
      version: '7.0.0'
    }
  })
  const mongoUri = mongod.getUri()

  process.env.MONGO_URI = mongoUri
  process.env.MONGO_DATABASE = dbName

  config.set('mongo.mongoUrl', mongoUri)
  config.set('mongo.databaseName', dbName)

  server = await createServer()

  return server
}

export const teardownTestEnvironment = async () => {
  if (server) {
    await server.stop()
  }
  if (mongod) {
    await mongod.stop()
  }
}
