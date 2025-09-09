import { createMessageSender } from './create-message-sender.js'
import { createMessage } from './create-message.js'
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'eu-west-2'
})

export const sendMessage = async (body, type, config, options) => {
  const message = createMessage(body, type, options)
  const sender = createMessageSender(config)
  await sender.sendMessage(message)
}

export async function sendMessageToSQS(queueUrl, messageBody, attributes = {}) {
  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageAttributes: attributes
    })

    const response = await sqsClient.send(command)

    console.log('✅ Message sent successfully:', {
      MessageId: response.MessageId,
      MD5OfMessageBody: response.MD5OfMessageBody
    })

    return response
  } catch (err) {
    console.error('❌ Failed to send message:', err)
    throw err
  }
}
