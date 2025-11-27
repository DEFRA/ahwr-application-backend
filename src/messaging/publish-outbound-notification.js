import { publishMessage, setupClient } from 'ffc-ahwr-common-library'
import { config } from '../config/config.js'
import { getLogger } from '../logging/logger.js'

const { applicationDocRequestMsgType, messageGeneratorMsgType } = config.get('messageTypes')
let clientConfigured

export async function publishDocumentRequestEvent(logger, messageBody) {
  configureClient()

  const attributes = {
    eventType: applicationDocRequestMsgType
  }

  await publishMessage(messageBody, attributes, config.get('sns.documentRequestedTopicArn'))

  logger.info('Document request event published')
}

export async function publishStatusChangeEvent(logger, messageBody) {
  configureClient()

  const attributes = {
    eventType: messageGeneratorMsgType
  }

  await publishMessage(messageBody, attributes, config.get('sns.statusChangeTopicArn'))

  logger.info('Status change event published')
}

function configureClient() {
  if (!clientConfigured) {
    setupClient(
      config.get('aws.region'),
      config.get('aws.endpointUrl'),
      getLogger(),
      'specify-topic-when-publishing'
    )
    clientConfigured = true
  }
}
