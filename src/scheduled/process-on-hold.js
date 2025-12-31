import { STATUS } from 'ffc-ahwr-common-library'
import { updateClaimStatuses, findOnHoldClaims } from '../repositories/claim-repository.js'
import { getLogger } from '../logging/logger.js'

export const processOnHoldClaims = async (db) => {
  const now = new Date()
  const date24HrsAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const onHoldClaims = await findOnHoldClaims({ db, beforeDate: date24HrsAgo })
  const onHoldClaimReferences = onHoldClaims.map((claim) => claim.reference)

  if (onHoldClaimReferences.length) {
    const { updatedRecordCount } = await updateClaimStatuses({
      db,
      references: onHoldClaimReferences,
      status: STATUS.READY_TO_PAY,
      user: 'admin',
      updatedAt: new Date()
    })

    getLogger().info(
      `Of ${onHoldClaimReferences.length} claims on hold, ${updatedRecordCount} updated to ready to pay.`
    )
  } else {
    getLogger().info('No claims to move from on hold to ready to pay.')
  }
}
