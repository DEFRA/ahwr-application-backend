import { validateClaimStatusToPaidEvent } from '../schema/set-payment-status-to-paid-schema.js'
import { getClaimByReference } from '../../repositories/claim-repository.js'
import {
  TYPE_OF_LIVESTOCK,
  UNNAMED_FLOCK,
  UNNAMED_HERD
} from 'ffc-ahwr-common-library'
import { sendMessage } from '../send-message.js'
import { config } from '../../config/config.js'
import { v4 as uuid } from 'uuid'
import { messageQueueConfig } from '../../config/message-queue.js'

const messageGeneratorMsgType = config.get(
  'messageTypes.messageGeneratorMsgType'
)
const messageGeneratorQueue = messageQueueConfig.messageGeneratorQueue // TODO: should be in main config

export const setPaymentStatusToPaid = async (message, logger) => {
  try {
    const msgBody = message.body

    if (validateClaimStatusToPaidEvent(msgBody, logger)) {
      const { claimRef, sbi } = msgBody
      logger.info(`Setting payment status to paid for claim ${claimRef}...`)
      //TODO use updateClaimStatus
      // await updateClaimByReference(
      //   {
      //     reference: claimRef,
      //     statusId: STATUS.PAID,
      //     updatedBy: 'admin',
      //     sbi
      //   },
      //   undefined,
      //   logger
      // )
      // await raiseClaimEvents(
      //   {
      //     message: 'Claim has been updated',
      //     claim: updatedRecord.dataValues,
      //     note,
      //     raisedBy: updatedRecord.dataValues.updatedBy,
      //     raisedOn: updatedRecord.dataValues.updatedAt
      //   },
      //   data.sbi
      // )
      const { dataValues: claimDataValues } =
        await getClaimByReference(claimRef)

      const {
        applicationReference,
        reference: claimReference,
        statusId,
        data: { claimType, typeOfLivestock },
        herd
      } = claimDataValues

      await sendMessage(
        {
          sbi,
          agreementReference: applicationReference,
          claimReference,
          claimStatus: statusId,
          claimType,
          typeOfLivestock,
          dateTime: new Date(),
          herdName:
            herd?.herdName ||
            (typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP
              ? UNNAMED_FLOCK
              : UNNAMED_HERD)
        },
        messageGeneratorMsgType,
        messageGeneratorQueue,
        { sessionId: uuid() }
      )
    } else {
      throw new Error(
        `Invalid message body in payment status to paid event: claimRef: ${msgBody.claimRef} sbi: ${msgBody.sbi}`
      )
    }
  } catch (error) {
    logger.error(`Failed to move claim to paid status: ${error.message}`)
  }
}
