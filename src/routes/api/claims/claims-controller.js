import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import { processClaim, isURNNumberUnique, getClaim } from './claims-service.js'
import { getClaimByReference, updateClaimStatus } from '../../../repositories/claim-repository.js'
import { getApplication } from '../../../repositories/application-repository.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import {
  publishRequestForPaymentEvent,
  publishStatusChangeEvent
} from '../../../messaging/publish-outbound-notification.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../lib/context-helper.js'
import { piHunt } from '../../../constants/index.js'
import { STATUS, TYPE_OF_LIVESTOCK, UNNAMED_FLOCK, UNNAMED_HERD } from 'ffc-ahwr-common-library'

export const createClaimHandler = async (request, h) => {
  try {
    const { payload, logger, db } = request

    const claim = await processClaim({ payload, logger, db })

    return h.response(claim).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to create claim')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}

export const isURNUniqueHandler = async (request, h) => {
  try {
    const { sbi, laboratoryURN } = request.payload

    const result = await isURNNumberUnique({
      db: request.db,
      sbi,
      laboratoryURN
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to check if URN is unique')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}

export const getClaimHandler = async (request, h) => {
  try {
    const { reference } = request.params

    const result = await getClaim({
      db: request.db,
      logger: request.logger,
      reference
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to get claim')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}

export const updateClaimStatusHandler = async (request, h) => {
  const { reference, status, note, user } = request.payload
  const { db, logger } = request

  const claim = await getClaimByReference(db, reference)
  if (!claim) {
    return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
  }

  const {
    amount,
    typeOfLivestock,
    reviewTestResults,
    vetVisitsReviewTestResults,
    piHuntRecommended,
    piHuntAllAnimals
  } = claim.data || {}

  const { applicationReference, type } = claim

  const application = await getApplication({
    db,
    reference: applicationReference
  })

  const { crn, frn, sbi } = application.organisation || {}

  if (claim.status === status) {
    logger.info(`Claim ${reference} already has status ${status}, no update needed.`)
    return h.response().code(StatusCodes.NO_CONTENT)
  }

  const updatedClaim = await updateClaimStatus({
    db,
    reference,
    status,
    user,
    updatedAt: new Date(),
    note
  })

  await raiseClaimEvents(
    {
      message: 'Claim has been updated',
      claim: { ...updatedClaim, id: updatedClaim._id.toString() },
      note,
      raisedBy: updatedClaim.updatedBy,
      raisedOn: updatedClaim.updatedAt
    },
    sbi
  )

  await publishStatusChangeEvent(logger, {
    crn,
    sbi,
    agreementReference: applicationReference,
    claimReference: reference,
    claimStatus: status,
    claimType: type,
    typeOfLivestock,
    reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
    piHuntRecommended,
    piHuntAllAnimals,
    claimAmount: amount,
    dateTime: new Date(),
    herdName: claim.herd?.name ?? getUnnamedHerdValueByTypeOfLivestock(typeOfLivestock)
  })

  if (status === STATUS.READY_TO_PAY) {
    const optionalPiHuntValue = getOptionalPiHuntValue(claim)

    await publishRequestForPaymentEvent(logger, {
      reference,
      sbi,
      whichReview: typeOfLivestock,
      isEndemics: true,
      claimType: claim.type,
      reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
      frn,
      optionalPiHuntValue
    })
  }

  return h.response().code(StatusCodes.OK)
}

const getOptionalPiHuntValue = (claim) => {
  let optionalPiHuntValue

  if (isVisitDateAfterPIHuntAndDairyGoLive(claim.data.dateOfVisit)) {
    optionalPiHuntValue =
      claim.data.piHunt === piHunt.yes && claim.data.piHuntAllAnimals === piHunt.yes
        ? 'yesPiHunt'
        : 'noPiHunt'
  }

  return optionalPiHuntValue
}

const getUnnamedHerdValueByTypeOfLivestock = (typeOfLivestock) =>
  typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD
