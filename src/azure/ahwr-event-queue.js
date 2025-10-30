import crypto from 'crypto-js'
import { ProxyAgent } from 'undici'
import { config } from '../config/config.js'
// import { initCache } from '../common/helpers/cache.js'

const httpProxy = config.get('httpProxy')
const eventQueueConfig = config.get('azure.eventQueue')

// let cache = null

const getAzureServiceBusToken = () => {
  const encoded = encodeURIComponent(eventQueueConfig.uri)
  const ttl = Math.round(new Date().getTime() / 1000) + eventQueueConfig.ttl
  const signature = `${encoded}\n${ttl}`
  const hash = crypto
    .HmacSHA256(signature, eventQueueConfig.key)
    .toString(crypto.enc.Base64)
  return `SharedAccessSignature sr=${encoded}&sig=${encodeURIComponent(hash)}&se=${ttl}&skn=${eventQueueConfig.keyName}`
}

// const getCachedToken = (server) => {
//   if (!cache) {
//     cache = initCache(server, 'token', getAzureServiceBusToken, {
//       expiresIn: eventQueueConfig.ttl
//     })
//   }
//   return cache
// }

const proxyFetch = (url, options) => {
  const proxyUrlConfig = httpProxy // bound to HTTP_PROXY

  if (!proxyUrlConfig) {
    return fetch(url, options)
  }

  return fetch(url, {
    ...options,
    dispatcher: new ProxyAgent({
      uri: proxyUrlConfig,
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10
    })
  })
}

export const sendMessage = async (server, logger, body) => {
  if (logger && typeof logger.info === 'function') {
    logger.info(
      `Message to be sent to AHWR Event queue: ${JSON.stringify(body)}`
    )
  }

  if (!eventQueueConfig.keyName || !eventQueueConfig.key) {
    throw new Error('AHWR Event keyname or key is not set')
  }

  const accessToken = getAzureServiceBusToken() // await getCachedToken(server).get('token')
  const brokerProperties = {
    SessionId: '123'
  }

  const url = new URL(`${eventQueueConfig.uri}/messages`)
  const response = await proxyFetch(url, {
    method: 'POST',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
      BrokerProperties: JSON.stringify(brokerProperties)
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`AHWR Event request failed: ${response.statusText}`)
  }

  logger.info('The AHWR Event request sent successfully')

  return {
    status: 'success',
    message: 'Payload sent to AHWR Event successfully'
  }
}
