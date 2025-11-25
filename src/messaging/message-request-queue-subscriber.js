import { config } from '../config/config.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../logging/logger.js'
import { processApplicationMessage } from './process-message.js'

let messageRequestSubscriber

export async function configureAndStart(db) {
  messageRequestSubscriber = new SqsSubscriber({
    queueUrl: config.get('sqs.applicationRequestQueueUrl'),
    logger: getLogger(),
    region: config.get('aws.region'),
    awsEndpointUrl: config.get('aws.endpointUrl'),
    async onMessage(message, attributes) {
      getLogger().info(attributes, 'Received incoming message')
      await processApplicationMessage(message, db, getLogger(), attributes)
    }
  })
  await messageRequestSubscriber.start()
}

export async function stopSubscriber() {
  if (messageRequestSubscriber) {
    await messageRequestSubscriber.stop()
  }
}
