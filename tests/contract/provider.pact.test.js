import path from 'path'
import { Verifier } from '@pact-foundation/pact'
import { config } from '../../src/config/config.js'
import { setupTestEnvironment, teardownTestEnvironment } from '../integration/test-utils.js'
import { applications } from './data/applications.js'
import { claims } from './data/claims.js'

jest.mock('../../src/messaging/fcp-messaging-service.js', () => ({
  startFcpMessagingService: jest.fn(),
  stopFcpMessagingService: jest.fn()
}))

jest.mock('../../src/messaging/application-message-queue-subscriber.js', () => ({
  configureAndStartMessaging: jest.fn(),
  stopMessageSubscriber: jest.fn()
}))

jest.mock('../../src/distributed-jobs/distributed-startup-job.js', () => ({
  runDistributedStartupJobInBackground: jest.fn()
}))

describe('Pact provider verification: ahwr-application-backend', () => {
  let server

  beforeAll(async () => {
    config.set('port', 0)
    server = await setupTestEnvironment()
    await server.start()

    await server.db.collection('applications').deleteMany({})
    await server.db.collection('claims').deleteMany({})

    await server.db.collection('applications').insertMany(applications)
    await server.db.collection('claims').insertMany(claims)
  }, 30000)

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  it('satisfies all consumer expectations from ahwr-backoffice-ui', async () => {
    await new Verifier({
      provider: 'ahwr-application-backend',
      providerBaseUrl: `http://localhost:${server.info.port}`,
      pactUrls: [path.resolve('pacts/ahwr-backoffice-ui-ahwr-application-backend.json')],
      requestFilter: (req, _res, next) => {
        // Pact paths omit the /api prefix (applicationApiUri in the UI includes it
        // in production but not in the pact mock), so prepend it for all endpoints.
        // Exclude Pact's own internal /_pact* routes from the rewrite.
        if (!req.url.startsWith('/_')) {
          req.url = `/api${req.url}`
        }
        req.headers['x-api-key'] = 'test-backoffice-ui-api-key'
        next()
      }
    }).verifyProvider()
  }, 30000)
})
