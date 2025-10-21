import { createMessageSender } from './create-message-sender.js'
import { createMessage } from './create-message.js'

export const sendMessage = async (body, type, config, options) => {
  const message = createMessage(body, type, options)
  const sender = createMessageSender(config)
  console.log(`BH TEST 1: ${sender}`)
  console.log(`BH TEST 2: ${config.useCredentialChain}`)
  console.log(`BH TEST 3: ${config.address}`)
  console.log(`BH TEST 4: ${config.connectionString.includes('1.servicebus.windows.net')}`)
  await sender.sendMessage(message)
}
