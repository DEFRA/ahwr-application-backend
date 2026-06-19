import { validateClaimStatusToPaidEvent } from '../schema/set-payment-status-to-paid-schema.js'
import { getClaimByReference, updateClaimStatus } from '../../repositories/claim-repository.js'
import { STATUS } from 'ffc-ahwr-common-library'
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
    } else {
      throw new Error(
        `Invalid message in payment status to paid event: claimRef: ${message.claimRef} sbi: ${message.sbi}`
      )
    }
  } catch (error) {
    logger.error(`Failed to move claim to paid status: ${error.message}`)
  }
}
