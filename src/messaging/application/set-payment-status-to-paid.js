import { validateClaimStatusToPaidEvent } from '../schema/set-payment-status-to-paid-schema.js'
import { getClaimByReference, updateClaimStatus } from '../../repositories/claim-repository.js'
import { TYPE_OF_LIVESTOCK, UNNAMED_FLOCK, UNNAMED_HERD, STATUS } from 'ffc-ahwr-common-library'
import { publishStatusChangeEvent } from '../publish-outbound-notification.js'
import { raiseClaimEvents } from '../../event-publisher/index.js'
import { metricsCounter } from '../../common/helpers/metrics.js'

export const setPaymentStatusToPaid = async (message, db, logger) => {
  await metricsCounter('set_payment_status_to_paid_events_received')
  try {
    if (validateClaimStatusToPaidEvent(message, logger)) {
      const { claimRef, sbi } = message
      logger.info(`Setting payment status to paid for claim: ${claimRef}`)

      const claim = await getClaimByReference(db, claimRef)
      if (!claim || claim.status === STATUS.PAID) {
        logger.warn({ status: claim?.status, claimRef }, 'Claim does not exist or status is paid')
        return
      }

      const updatedClaim = await updateClaimStatus({
        db,
        reference: claimRef,
        status: STATUS.PAID,
        user: 'admin',
        updatedAt: new Date()
      })

      const {
        applicationReference,
        status,
        type,
        data: { typeOfLivestock },
        herd
      } = updatedClaim

      await raiseClaimEvents(
        {
          message: 'Claim has been updated',
          claim: { ...updatedClaim, id: updatedClaim._id.toString() },
          note: undefined,
          raisedBy: updatedClaim.updatedBy,
          raisedOn: updatedClaim.updatedAt
        },
        sbi
      )
      const statusChangeMessage = {
        sbi,
        agreementReference: applicationReference,
        claimReference: claimRef,
        claimStatus: status,
        claimType: type,
        typeOfLivestock,
        dateTime: updatedClaim.updatedAt,
        herdName:
          herd?.name || (typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD)
      }
      await publishStatusChangeEvent(logger, statusChangeMessage)
    } else {
      throw new Error(
        `Invalid message in payment status to paid event: claimRef: ${message.claimRef} sbi: ${message.sbi}`
      )
    }
  } catch (error) {
    logger.error(`Failed to move claim to paid status: ${error.message}`)
  }
}
