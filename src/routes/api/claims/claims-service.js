import {
  isURNUnique as isNWURNUnique,
  getClaimByReference,
  setWithdrawalRequested
} from '../../../repositories/claim-repository.js'
import { getApplication, getApplicationsBySbi } from '../../../repositories/application-repository.js'
import { createWithdrawalRequest } from '../../../repositories/withdrawal-request-repository.js'
import { isOWURNUnique } from '../../../repositories/ow-application-repository.js'
import { createClaimReference, createPoultryClaimReference } from '../../../lib/create-reference.js'
import { APPLICATION_REFERENCE_PREFIX_POULTRY, claimType, STATUS } from 'ffc-ahwr-common-library'

import {
  saveClaimAndRelatedData,
  generateEventsAndComms
} from '../../../processing/claim/ahwr/processor.js'
import Boom from '@hapi/boom'
import { trackError } from '../../../logging/logger.js'
import { validateAhwrClaim } from '../../../processing/claim/ahwr/base-validation.js'
import { validatePoultryClaim } from '../../../processing/claim/poultry/base-validation.js'
import {
  generatePoultryEventsAndComms,
  savePoultryClaimAndRelatedData
} from '../../../processing/claim/poultry/processor.js'

const isFollowUp = (payload) => payload.type === claimType.endemics

export const checkIfPoultryAgreement = (reference) => {
  return reference?.startsWith(APPLICATION_REFERENCE_PREFIX_POULTRY)
}

const processLivestockClaim = async ({
  application,
  applicationReference,
  payload,
  flags,
  data,
  type,
  logger,
  tempClaimReference,
  sbi,
  db
}) => {
  const { typeOfLivestock, laboratoryURN, herd } = data || {}

  const { value: validatedPayload, error } = validateAhwrClaim(payload, flags)

  if (error) {
    logger.setBindings({ error })
    trackError(logger, error, 'failed-validation', 'Create claim validation error')
    throw Boom.badRequest(error.message)
  }

  const claimReference = createClaimReference(tempClaimReference, type, typeOfLivestock)

  logger.setBindings({
    isFollowUp: isFollowUp(validatedPayload),
    applicationReference,
    claimReference,
    laboratoryURN,
    sbi
  })

  if (laboratoryURN) {
    const { isURNUnique } = await isURNNumberUnique({ db, sbi, laboratoryURN })
    if (!isURNUnique) {
      throw Boom.badRequest('URN number is not unique')
    }
  }

  const { claim, herdGotUpdated, herdData, isMultiHerdsClaim } = await saveClaimAndRelatedData({
    db,
    sbi,
    claimPayload: validatedPayload,
    claimReference,
    flags,
    logger
  })

  if (!claim) {
    throw new Error('Claim was not created')
  }

  // now send outbound events and comms. For now, we will call directly here and not await. Ideally we would move this to an offline
  // async process by sending a message to the application input queue. But will save that for part 3 as this current change is already complex
  await generateEventsAndComms(
    isMultiHerdsClaim,
    claim,
    application,
    herdData,
    herdGotUpdated,
    herd?.id
  )

  return claim
}

const processPoultryClaim = async ({
  application,
  applicationReference,
  payload,
  flags,
  data,
  logger,
  tempClaimReference,
  sbi,
  db
}) => {
  const { site } = data || {}

  const { value: validatedPayload, error } = validatePoultryClaim(payload)

  if (error) {
    logger.setBindings({ error })
    trackError(logger, error, 'failed-validation', 'Create claim validation error')
    throw Boom.badRequest(error.message)
  }

  const claimReference = createPoultryClaimReference(tempClaimReference)

  logger.setBindings({
    applicationReference,
    claimReference,
    sbi
  })

  const { claim, siteCreated, herdData } = await savePoultryClaimAndRelatedData({
    db,
    sbi,
    claimPayload: validatedPayload,
    claimReference,
    flags,
    logger
  })

  if (!claim) {
    throw new Error('Claim was not created')
  }

  // now send outbound events and comms. For now, we will call directly here and not await. Ideally we would move this to an offline
  // async process by sending a message to the application input queue. But will save that for part 3 as this current change is already complex
  await generatePoultryEventsAndComms(claim, application, herdData, site?.id, siteCreated)

  return claim
}

export const processClaim = async ({ payload, logger, db }) => {
  const { applicationReference, type, reference: tempClaimReference, data } = payload
  const isPoultryAgreement = checkIfPoultryAgreement(applicationReference)

  const application = await getApplication({
    db,
    reference: applicationReference
  })
  if (!application) {
    throw Boom.notFound('Application not found')
  }

  const {
    flags,
    organisation: { sbi }
  } = application

  if (isPoultryAgreement) {
    return processPoultryClaim({
      application,
      applicationReference,
      payload,
      flags,
      data,
      logger,
      tempClaimReference,
      sbi,
      db
    })
  } else {
    return processLivestockClaim({
      application,
      applicationReference,
      payload,
      flags,
      sbi,
      type,
      tempClaimReference,
      data,
      logger,
      db
    })
  }
}

export const isURNNumberUnique = async ({ db, sbi, laboratoryURN, includeWithdrawns = false }) => {
  const applications = await getApplicationsBySbi(db, sbi)
  const applicationReferences = applications.map((a) => a.reference)

  const results = await Promise.all([
    isNWURNUnique({
      db,
      applicationReferences,
      laboratoryURN,
      includeWithdrawns
    }),
    isOWURNUnique({
      db,
      sbi,
      laboratoryURN
    })
  ])

  return {
    isURNUnique: results.every(Boolean)
  }
}

export const getClaim = async ({ db, reference }) => {
  const claim = await getClaimByReference(db, reference)
  if (!claim) {
    throw Boom.notFound('Claim not found')
  }

  return {
    reference: claim.reference,
    applicationReference: claim.applicationReference,
    createdAt: claim.createdAt,
    type: claim.type,
    data: claim.data,
    status: claim.status,
    statusHistory: claim.statusHistory,
    herd: claim.herd,
    updateHistory: claim.updateHistory,
    isWithdrawalRequested: claim.isWithdrawalRequested === true
  }
}

export const withdrawClaim = async ({ db, reference, withdrawal, user }) => {
  const claim = await getClaimByReference(db, reference)
  if (!claim) {
    throw Boom.notFound('Claim not found')
  }

  if (claim.status !== STATUS.IN_CHECK) {
    throw Boom.conflict('Claim must be in check to request a withdrawal')
  }

  const application = await getApplication({ db, reference: claim.applicationReference })

  // Submitting only records a request: the claim keeps its status, and gets isWithdrawalRequested
  // set. The claim status, agreement flag and withdrawn event are applied when the request is
  // authorised (separate ticket). The flag is set first and atomically, which also rejects a
  // second request while one is pending.
  const flagged = await setWithdrawalRequested({ db, reference, isWithdrawalRequested: true })
  if (!flagged) {
    throw Boom.conflict('A withdrawal request is already pending for this claim')
  }

  try {
    await createWithdrawalRequest({
      db,
      withdrawalRequest: {
        claimReference: reference,
        agreementReference: claim.applicationReference,
        sbi: application.organisation.sbi,
        ...withdrawal,
        createdBy: user,
        createdAt: new Date()
      }
    })
  } catch (error) {
    await setWithdrawalRequested({ db, reference, isWithdrawalRequested: false })
    throw error
  }

  return { ...claim, isWithdrawalRequested: true }
}
