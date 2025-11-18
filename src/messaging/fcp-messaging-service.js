import {
  createServiceBusClient,
  createEventPublisher
} from 'ffc-ahwr-common-library'
import { config } from '../config/config.js'

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
}

export const stopMessagingService = async () => {
  if (fcpMessageClient) {
    await fcpMessageClient.close()
  }
}

export const getEventPublisher = () => {
  return eventPublisher
}
