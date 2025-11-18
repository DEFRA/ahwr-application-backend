import { getAmount } from '../../../lib/getAmount.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import {
  getByApplicationReference,
  createClaim
} from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
// import { sendMessage } from '../../../messaging/send-message.js'
// import { v4 as uuid } from 'uuid'
// import {
//   TYPE_OF_LIVESTOCK,
//   UNNAMED_FLOCK,
//   UNNAMED_HERD
// } from 'ffc-ahwr-common-library'
// import { config } from '../../../config/config.js'
import { processHerd } from './herd-processor.js'
// import { messageQueueConfig } from '../../../config/message-queue.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'

// const messageGeneratorMsgType = config.get(
//   'messageTypes.messageGeneratorMsgType'
// )
// const messageGeneratorQueue = messageQueueConfig.messageGeneratorQueue // TODO: get from main config

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

      const createdAt = new Date()

      claim = {
        ...claimPayload,
        reference: claimReference,
        data: {
          ...payloadData,
          amount,
          claimType: claimPayload.type
        },
        status,
        herd: claimHerdData,
        createdAt,
        statusHistory: [
          { status, createdBy: claimPayload.createdBy, createdAt }
        ]
      }
      const result = await createClaim(db, claim)
      await raiseClaimEvents(
        {
          message: 'New claim has been created',
          claim: { ...claim, id: result.insertedId.toString() },
          raisedBy: claimPayload.createdBy,
          raisedOn: createdAt
        },
        sbi
      )
    })
  } finally {
    await session.endSession()
  }

  return { claim, herdGotUpdated, herdData }
}

// const getUnnamedHerdValue = (typeOfLivestock) =>
//   typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD

export async function saveClaimAndRelatedData({
  db,
  sbi,
  claimPayload,
  claimReference,
  flags,
  logger
}) {
  const { typeOfLivestock, dateOfVisit } = claimPayload.data
  const { applicationReference } = claimPayload

  const amount = await getAmount(claimPayload)
  const isMultiHerdsClaim = isMultipleHerdsUserJourney(dateOfVisit, flags)

  const { claim, herdGotUpdated, herdData } = await addClaimAndHerdToDatabase({
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
  const { reference: claimReference } = claim
  // const {
  // amount,
  // typeOfLivestock,
  // // dateOfVisit,
  // reviewTestResults,
  // piHuntRecommended,
  // piHuntAllAnimals
  // } = claim.data
  const {
    reference: applicationReference,
    organisation: { sbi }
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

  // TODO
  // await sendMessage(
  //   {
  //     crn,
  //     sbi,
  //     agreementReference: applicationReference,
  //     claimReference,
  //     claimStatus: statusId,
  //     claimType: type,
  //     typeOfLivestock,
  //     reviewTestResults,
  //     piHuntRecommended,
  //     piHuntAllAnimals,
  //     claimAmount: amount,
  //     dateTime: new Date(),
  //     herdName: herdData.name ?? getUnnamedHerdValue(typeOfLivestock)
  //   },
  //   messageGeneratorMsgType,
  //   messageGeneratorQueue,
  //   { sessionId: uuid() }
  // )

  // appInsights.defaultClient.trackEvent({
  //   name: 'process-claim',
  //   properties: {
  //     data: {
  //       applicationReference,
  //       typeOfLivestock,
  //       dateOfVisit,
  //       claimType: type,
  //       piHunt: claim.data.piHunt
  //     },
  //     reference: claim.reference,
  //     status: claim.statusId,
  //     sbi,
  //     scheme: 'new-world'
  //   }
  // })
}
