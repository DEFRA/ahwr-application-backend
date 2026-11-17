import { getScheme, POULTRY_SCHEME, STATUS } from 'ffc-ahwr-common-library'
import { updateClaimStatuses, findOnHoldClaims } from '../repositories/claim-repository.js'
import { getLogger } from '../logging/logger.js'
import {
  publishRequestForPaymentEvent,
  publishStatusChangeEvent
} from '../messaging/publish-outbound-notification.js'
import { getApplication } from '../repositories/application-repository.js'
import {
  checkForPiHunt,
  getHerdName,
  getReviewTestResults,
  isVisitDateAfterPIHuntAndDairyGoLive
} from '../lib/context-helper.js'
import { raiseClaimEvents } from '../event-publisher/index.js'

/** @param {import('mongodb').Db} db */
export const processOnHoldClaims = async (db) => {
  const now = new Date()
  const date24HrsAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const onHoldClaims = await findOnHoldClaims({ db, beforeDate: date24HrsAgo })
  const onHoldClaimReferences = onHoldClaims.map((/** @type {{ reference: string }} */ claim) => claim.reference)

  const updatedAt = new Date()
  if (onHoldClaimReferences.length) {
    const { updatedRecordCount } = await updateClaimStatuses({
      db,
      references: onHoldClaimReferences,
      status: STATUS.READY_TO_PAY,
      user: 'admin',
      updatedAt
    })

    const applications = await Promise.all(
      onHoldClaims.map((/** @type {{ applicationReference: string }} */ claim) =>
        getApplication({
          db,
          reference: claim.applicationReference
        })
      )
    )

    await Promise.all(onHoldClaims.map(async (/** @type {{ applicationReference: string, reference: string, _id: import('mongodb').ObjectId }} */ claim, /** @type {number} */ index) => {
      const application = applications[index]

      const { crn, frn, sbi } = application.organisation || {}

      await raiseClaimEvents(
        {
          message: 'Claim has been updated',
          claim: { ...claim, status: 'READY_TO_PAY', id: claim._id.toString() },
          note: 'Automatic update',
          raisedBy: 'admin',
          raisedOn: updatedAt
        },
        sbi
      )

      const { statusChangeMessageBody, paymentEventMessageBody } = getSchemeSpecificMessageBodies(
        crn,
        sbi,
        frn,
        claim,
        updatedAt
      )

      await publishStatusChangeEvent(getLogger(), statusChangeMessageBody)
      await publishRequestForPaymentEvent(getLogger(), paymentEventMessageBody)
    }))
    getLogger().info(
      `Of ${onHoldClaimReferences.length} claims on hold, ${updatedRecordCount} updated to ready to pay.`
    )
  } else {
    getLogger().info('No claims to move from on hold to ready to pay.')
  }
}

/**
 * @param {string | undefined} crn
 * @param {string | undefined} sbi
 * @param {string | undefined} frn
 * @param {Record<string, any>} claim
 * @param {Date} updatedAt
 */
const getSchemeSpecificMessageBodies = (crn, sbi, frn, claim, updatedAt) => {
  if (getScheme(claim.applicationReference) === POULTRY_SCHEME) {
    const statusChangeMessageBody = {
      crn,
      sbi,
      agreementReference: claim.applicationReference,
      claimReference: claim.reference,
      claimAmount: claim.data.amount,
      // Mongo slow updating, set straight to ready to pay
      claimStatus: STATUS.READY_TO_PAY,
      claimType: claim.type,
      typesOfPoultry: claim.data.typesOfPoultry,
      // Mongo slow updating, set straight to updatedAt
      dateTime: updatedAt,
      herdName: claim.herd.name
    }
    const paymentEventMessageBody = {
      whichReview: 'poultry',
      reference: claim.reference,
      sbi,
      frn
    }
    return { statusChangeMessageBody, paymentEventMessageBody }
  } else {
    const statusChangeMessageBody = {
      crn,
      sbi,
      agreementReference: claim.applicationReference,
      claimReference: claim.reference,
      claimAmount: claim.data.amount,
      // Mongo slow updating, set straight to ready to pay
      claimStatus: STATUS.READY_TO_PAY,
      claimType: claim.type,
      typeOfLivestock: claim.data.typeOfLivestock,
      // Mongo slow updating, set straight to updatedAt
      dateTime: updatedAt,
      herdName: getHerdName(claim),
      reviewTestResults: getReviewTestResults(claim),
      piHuntRecommended: claim.data.piHuntRecommended,
      piHuntAllAnimals: claim.data.piHuntAllAnimals
    }
    const paymentEventMessageBody = {
      reference: claim.reference,
      sbi,
      whichReview: claim.data.typeOfLivestock,
      // Seems to be true everywhere?
      isEndemics: true,
      claimType: claim.type,
      dateOfVisit: claim.data.dateOfVisit,
      reviewTestResults: getReviewTestResults(claim),
      frn,
      optionalPiHuntValue: isVisitDateAfterPIHuntAndDairyGoLive(claim.data.dateOfVisit)
        ? checkForPiHunt(claim)
        : undefined
    }
    return { statusChangeMessageBody, paymentEventMessageBody }
  }
}
