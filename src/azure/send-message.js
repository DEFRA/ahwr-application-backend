import { createMessageSender } from './create-message-sender.js'
import { createMessage } from './create-message.js'

export const sendMessage = async (body, type, config, options) => {
  console.log('BH TEST: starting send via lib')
  console.log(`BH TEST: config check: ${config.address}`)
  const message = createMessage(body, type, options)
  const sender = createMessageSender(config)
  console.log('BH TEST: starting send message')
  await sender.sendMessage(message)
}
