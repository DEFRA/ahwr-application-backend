import { STATUS } from 'ffc-ahwr-common-library'
import {
  updateClaimStatuses,
  findOnHoldClaims,
  getClaimByReference
} from '../repositories/claim-repository.js'
import { getLogger } from '../logging/logger.js'
import {
  publishRequestForPaymentEvent,
  publishStatusChangeEvent
} from '../messaging/publish-outbound-notification.js'
import { getApplication } from '../repositories/application-repository.js'
import { piHunt, piHuntAllAnimals } from '../constants/index.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../lib/context-helper.js'

export const processOnHoldClaims = async (db) => {
  const now = new Date()
  const date24HrsAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const onHoldClaims = await findOnHoldClaims({ db, beforeDate: date24HrsAgo })
  const onHoldClaimReferences = onHoldClaims.map((claim) => claim.reference)

  const updatedAt = new Date()
  if (onHoldClaimReferences.length) {
    const { updatedRecordCount } = await updateClaimStatuses({
      db,
      references: onHoldClaimReferences,
      status: STATUS.READY_TO_PAY,
      user: 'admin',
      updatedAt
    })

    for (const reference of onHoldClaimReferences) {
      const claim = await getClaimByReference(db, reference)
      const application = await getApplication({
        db,
        reference: claim.applicationReference
      })

      const { crn, frn, sbi } = application.organisation || {}

      await publishStatusChangeEvent(getLogger(), {
        crn,
        sbi,
        agreementReference: claim.applicationReference,
        claimReference: claim.reference,
        // This is setup straight to ready to pay in case
        // Mongo is slow updating
        claimStatus: STATUS.READY_TO_PAY,
        claimType: claim.type,
        typeOfLivestock: claim.data.typeOfLivestock,
        // This is setup straight to udpatedat in case
        // Mongo is slow updating
        dateTime: updatedAt,
        herdName: claim.herd.name,
        reviewTestResults: claim.data.reviewTestResults,
        piHuntRecommended: claim.data.piHuntRecommended,
        piHuntAllAnimals: claim.data.piHuntAllAnimals
      })

      // We add here sending of the message to the queue using publishRequestForPaymentEvent
      const optionalPiHuntValue = isVisitDateAfterPIHuntAndDairyGoLive(claim.data.dateOfVisit)
        ? claim.data.piHunt === piHunt.yes && claim.data.piHuntAllAnimals === piHuntAllAnimals.yes
          ? 'yesPiHunt'
          : 'noPiHunt'
        : undefined

      await publishRequestForPaymentEvent(getLogger(), {
        reference,
        sbi,
        whichReview: claim.data.typeOfLivestock,
        // Seems to be true everywhere?
        isEndemics: true,
        claimType: claim.type,
        dateOfVisit: claim.data.dateOfVisit,
        reviewTestResults: claim.data.reviewTestResults,
        frn,
        optionalPiHuntValue
      })
    }
    getLogger().info(
      `Of ${onHoldClaimReferences.length} claims on hold, ${updatedRecordCount} updated to ready to pay.`
    )
  } else {
    getLogger().info('No claims to move from on hold to ready to pay.')
  }
}
