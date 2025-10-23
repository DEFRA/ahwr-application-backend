import { getAmount } from '../../../lib/getAmount.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import {
  getByApplicationReference,
  createClaim
} from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
import { sendMessage } from '../../../messaging/send-message.js'
import { v4 as uuid } from 'uuid'
import appInsights from 'applicationinsights'
import {
  TYPE_OF_LIVESTOCK,
  UNNAMED_FLOCK,
  UNNAMED_HERD
} from 'ffc-ahwr-common-library'
import { config } from '../../../config/index.js'
import { processHerd } from './herd-processor.js'

const { messageGeneratorMsgType, messageGeneratorQueue } = config

const addClaimAndHerdToDatabase = async ({
  sbi,
  applicationReference,
  claimReference,
  typeOfLivestock,
  amount,
  dateOfVisit,
  claimPayload,
  logger,
  isMultiHerdsClaim,
  db
}) => {
  let herdGotUpdated
  let herdData = {}
  const { herd, ...payloadData } = claimPayload.data

  const session = db.client.startSession()

  let claim
  try {
    await session.withTransaction(async () => {
      let claimHerdData = {}

      if (isMultiHerdsClaim) {
        const herdResult = await processHerd({
          herd,
          applicationReference,
          createdBy: claimPayload.createdBy,
          typeOfLivestock,
          sbi,
          logger,
          db
        })
        claimHerdData = herdResult.claimHerdData
        herdData = herdResult.herdData
        herdGotUpdated = herdResult.updated
      }

      const previousClaimsForSpeciesAfterUpdates =
        await getByApplicationReference({
          db,
          applicationReference,
          typeOfLivestock
        })
      const status = await generateClaimStatus(
        dateOfVisit,
        claimHerdData.id,
        previousClaimsForSpeciesAfterUpdates,
        logger
      )

      claim = {
        ...claimPayload,
        reference: claimReference,
        data: {
          ...payloadData,
          amount,
          claimType: claimPayload.type
        },
        status,
        herd: claimHerdData
      }
      await createClaim(db, claim)
    })
  } finally {
    await session.endSession()
  }

  return { claim, herdGotUpdated, herdData }
}

const getUnnamedHerdValue = (typeOfLivestock) =>
  typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD

export async function saveClaimAndRelatedData({
  db,
  sbi,
  payload,
  claimReference,
  flags,
  logger
}) {
  const { typeOfLivestock, dateOfVisit } = payload.data
  const { applicationReference } = payload

  const amount = await getAmount(payload)
  const isMultiHerdsClaim = isMultipleHerdsUserJourney(dateOfVisit, flags)

  const { claim, herdGotUpdated, herdData } = await addClaimAndHerdToDatabase({
    sbi,
    applicationReference,
    claimReference,
    typeOfLivestock,
    amount,
    dateOfVisit,
    claimPayload: payload,
    logger,
    isMultiHerdsClaim,
    db
  })

  return { claim, herdGotUpdated, herdData, isMultiHerdsClaim }
}

export async function generateEventsAndComms(
  isMultiHerdsClaim,
  claim,
  application,
  herdData,
  herdGotUpdated,
  herdIdSelected
) {
  const { reference: claimReference, type, statusId } = claim
  const {
    amount,
    typeOfLivestock,
    dateOfVisit,
    reviewTestResults,
    piHuntRecommended,
    piHuntAllAnimals
  } = claim.data
  const {
    reference: applicationReference,
    data: {
      organisation: { sbi, crn }
    }
  } = application

  if (isMultiHerdsClaim) {
    await emitHerdMIEvents({
      sbi,
      herdData,
      herdIdSelected,
      herdGotUpdated,
      claimReference,
      applicationReference
    })
  }

  await sendMessage(
    {
      crn,
      sbi,
      agreementReference: applicationReference,
      claimReference,
      claimStatus: statusId,
      claimType: type,
      typeOfLivestock,
      reviewTestResults,
      piHuntRecommended,
      piHuntAllAnimals,
      claimAmount: amount,
      dateTime: new Date(),
      herdName: herdData.name ?? getUnnamedHerdValue(typeOfLivestock)
    },
    messageGeneratorMsgType,
    messageGeneratorQueue,
    { sessionId: uuid() }
  )

  appInsights.defaultClient.trackEvent({
    name: 'process-claim',
    properties: {
      data: {
        applicationReference,
        typeOfLivestock,
        dateOfVisit,
        claimType: type,
        piHunt: claim.data.piHunt
      },
      reference: claim.reference,
      status: claim.statusId,
      sbi,
      scheme: 'new-world'
    }
  })
}
