import { config } from '../config/config.js'
import { sendMessage } from '../messaging/send-message.js'
import { messageQueueConfig } from '../config/message-queue.js'

const applicationEmailDocRequestMsgType = config.get(
  'messageTypes.applicationEmailDocRequestMsgType'
)
const applicationDocCreationRequestQueue =
  messageQueueConfig.applicationDocCreationRequestQueue // TODO: should move to main config

export const requestApplicationDocumentGenerateAndEmail = async (
  emailParams
) => {
  const {
    reference,
    sbi,
    whichSpecies,
    startDate,
    userType,
    email,
    farmerName,
    orgData: { orgName, orgEmail, crn }
  } = emailParams
  const message = {
    crn,
    reference,
    sbi,
    whichSpecies,
    startDate,
    userType,
    email,
    farmerName,
    name: orgName,
    ...(orgEmail && { orgEmail })
  }

  return sendMessage(
    message,
    applicationEmailDocRequestMsgType,
    applicationDocCreationRequestQueue
  )
}
