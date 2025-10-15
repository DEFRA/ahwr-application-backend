import { createMessageSender } from './create-message-sender.js'
import { createMessage } from './create-message.js'

export const sendMessage = async (body, type, config, options) => {
  const message = createMessage(body, type, options)
  const sender = createMessageSender(config)

  const tempConfig = {
    ...config,
    password: config.password
      ? `${config.password.substring(0, 3)}***`
      : 'not-set-correctly'
  }
  console.log(`BH sender: ${sender}`)
  console.log(`BH config: ${JSON.stringify(tempConfig)}`)
  console.log(`BH Message: ${JSON.stringify(message)}`)
  await sender.sendMessage(message)
}
