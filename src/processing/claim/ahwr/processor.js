import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import { createClaim } from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
import { TYPE_OF_LIVESTOCK, UNNAMED_FLOCK, UNNAMED_HERD, getAmount } from 'ffc-ahwr-common-library'
import { processHerd } from './herd-processor.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import { publishStatusChangeEvent } from '../../../messaging/publish-outbound-notification.js'
import { getLogger } from '../../../logging/logger.js'

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

      const status = await generateClaimStatus(dateOfVisit, logger, db)

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
        statusHistory: [{ status, createdBy: claimPayload.createdBy, createdAt }],
        updateHistory: [],
        updatedAt: createdAt
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

const getUnnamedHerdValue = (typeOfLivestock) =>
  typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD

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

  const amount = await getAmount({ ...claimPayload.data, type: claimPayload.type })
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
  const { reference: claimReference, status, type } = claim
  const { amount, typeOfLivestock, reviewTestResults, piHuntRecommended, piHuntAllAnimals } =
    claim.data
  const {
    reference: applicationReference,
    organisation: { crn, sbi }
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

  const logger = getLogger()

  await publishStatusChangeEvent(logger, {
    crn,
    sbi,
    agreementReference: applicationReference,
    claimReference,
    claimStatus: status,
    claimType: type,
    typeOfLivestock,
    reviewTestResults,
    piHuntRecommended,
    piHuntAllAnimals,
    claimAmount: amount,
    dateTime: new Date(),
    herdName: herdData.name ?? getUnnamedHerdValue(typeOfLivestock)
  })

  logger.info({
    event: {
      type: 'process-claim',
      reference: `${sbi} - ${applicationReference} - ${claimReference}`,
      outcome: `Status - ${status}`,
      kind: type,
      category: typeOfLivestock,
      created: new Date()
    }
  })
}
