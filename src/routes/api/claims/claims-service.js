import { isURNUnique as isNWURNUnique } from '../../../repositories/claim-repository.js'
import {
  getApplication,
  getApplicationRefencesBySbi
} from '../../../repositories/application-repository.js'
import { isURNUnique as isOWURNUnique } from '../../../repositories/ow-application-repository.js'
import { createClaimReference } from '../../../lib/create-reference.js'
import { validateClaim } from '../../../processing/claim/validation.js'
import { AHWR_SCHEME } from 'ffc-ahwr-common-library'
import { saveClaimAndRelatedData } from '../../../processing/claim/ahwr/processor.js'
import Boom from '@hapi/boom'
import { claimType } from '../../../constants/index.js'

const isFollowUp = (payload) => payload.type === claimType.endemics

export const processClaim = async ({ payload, logger, db }) => {
  const {
    applicationReference,
    type,
    reference: tempClaimReference,
    data
  } = payload
  const { typeOfLivestock, laboratoryURN } = data || {}

  const application = await getApplication(db, applicationReference)
  if (!application) {
    throw Boom.notFound('Application not found')
  }

  const {
    flags,
    organisation: { sbi }
  } = application

  const { error } = validateClaim(AHWR_SCHEME, payload, flags)
  if (error) {
    logger.setBindings({ error })
    // TODO
    // appInsights.defaultClient.trackException({ exception: error })
    throw Boom.badRequest(error.message)
  }

  const claimReference = createClaimReference(
    tempClaimReference,
    type,
    typeOfLivestock
  )

  logger.setBindings({
    isFollowUp: isFollowUp(payload),
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

  const { claim } = await saveClaimAndRelatedData({
    db,
    sbi,
    payload,
    claimReference,
    flags,
    logger
  })
  if (!claim) {
    throw new Error('Claim was not created')
  }

  // now send outbound events and comms. For now, we will call directly here and not await. Ideally we would move this to an offline
  // async process by sending a message to the application input queue. But will save that for part 3 as this current change is already complex

  // TODO
  // generateEventsAndComms(
  //     isMultiHerdsClaim,
  //     claim,
  //     application,
  //     herdData,
  //     herdGotUpdated,
  //     herd?.herdId
  // )

  return claim
}

export const isURNNumberUnique = async ({ db, sbi, laboratoryURN }) => {
  const applicationReferences = await getApplicationRefencesBySbi(db, sbi)

  const results = await Promise.all([
    isNWURNUnique({
      db,
      applicationReferences,
      laboratoryURN
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
