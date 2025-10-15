import { mongoDb } from './mongodb'
import { MongoClient } from 'mongodb'

jest.mock('mongodb', () => {
  const mockDb = {
    collection: jest.fn(() => ({
      createIndex: jest.fn()
    }))
  }
  const mockClient = {
    db: jest.fn(() => mockDb),
    close: jest.fn()
  }
  return {
    MongoClient: { connect: jest.fn(() => mockClient) }
  }
})

describe('mongodb', () => {
  let server
  let options

  beforeEach(() => {
    server = {
      logger: {
        info: jest.fn(),
        error: jest.fn()
      },
      decorate: jest.fn(),
      events: { on: jest.fn() }
    }
    options = {
      mongoUrl: 'mongodb://localhost:27017',
      mongoOptions: {},
      databaseName: 'ahwr-application-backend'
    }
  })

  it('should connect to mongo db and decorate server', async () => {
    await mongoDb.plugin.register(server, options)

    expect(MongoClient.connect).toHaveBeenCalledWith(
      options.mongoUrl,
      options.mongoOptions
    )
    expect(server.logger.info).toHaveBeenCalledWith('Setting up MongoDb')
    expect(server.decorate).toHaveBeenCalledWith(
      'server',
      'mongoClient',
      expect.any(Object)
    )
    expect(server.decorate).toHaveBeenCalledWith(
      'server',
      'db',
      expect.any(Object)
    )
    expect(server.decorate).toHaveBeenCalledWith(
      'server',
      'locker',
      expect.any(Object)
    )
  })

  it('should register stop event to close mongo db client', async () => {
    await mongoDb.plugin.register(server, options)
    const stopCallback = server.events.on.mock.calls.find(
      (call) => call[0] === 'stop'
    )[1]

    await stopCallback()

    const client = MongoClient.connect.mock.results[0].value
    expect(client.close).toHaveBeenCalledWith(true)
  })
})
