import {
  createServiceBusClient,
  createEventPublisher
} from 'ffc-ahwr-common-library'
import { config } from '../config/config.js'

// let applicationReceiver

let fcpMessageClient
let eventPublisher

export const startMessagingService = async (logger) => {
  fcpMessageClient = createServiceBusClient({
    host: config.get('azure.eventQueue.host'),
    username: config.get('azure.eventQueue.username'),
    password: config.get('azure.eventQueue.password'),
    proxyUrl: config.get('httpProxy')
  })

  eventPublisher = createEventPublisher(
    fcpMessageClient,
    config.get('azure.eventQueue.address'),
    logger
  )

  // TODO
  // const applicationAction = (message) =>
  //   processApplicationMessage(message, applicationReceiver, logger.child({}))
  // applicationReceiver = new MessageReceiver(
  //   messageQueueConfig.applicationRequestQueue, // TODO: should be main config
  //   applicationAction
  // )
  // await applicationReceiver.subscribe()
  // logger.info('Ready to receive messages')
}

export const stopMessagingService = async () => {
  if (fcpMessageClient) {
    await fcpMessageClient.close()
  }
  // await applicationReceiver.closeConnection()
}

export const getEventPublisher = () => {
  return eventPublisher
}
