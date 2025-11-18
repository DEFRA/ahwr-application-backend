import { MessageReceiver } from 'ffc-messaging'
import { closeAllConnections } from './create-message-sender.js'
import { processApplicationMessage } from './process-message.js'
import { messageQueueConfig } from '../config/message-queue.js'

let applicationReceiver

export const startMessagingService = async ({ db, logger }) => {
  const applicationAction = (message) =>
    processApplicationMessage(
      message,
      applicationReceiver,
      db,
      logger.child({})
    )
  applicationReceiver = new MessageReceiver(
    messageQueueConfig.applicationRequestQueue, // TODO: should be main config
    applicationAction
  )
  await applicationReceiver.subscribe()

  logger.info('Ready to receive messages')
}

export const stopMessagingService = async () => {
  await applicationReceiver.closeConnection()
  await closeAllConnections()
}
