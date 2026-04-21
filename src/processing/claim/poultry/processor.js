import { createClaim } from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { poultryPrice } from 'ffc-ahwr-common-library'
import { processSite } from './site-processor.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
import { getLogger } from '../../../logging/logger.js'
import { publishStatusChangeEvent } from '../../../messaging/publish-outbound-notification.js'

const addClaimAndSiteToDatabase = async ({
  sbi,
  applicationReference,
  claimReference,
  amount,
  dateOfReview,
  claimPayload,
  logger,
  db
}) => {
  let siteCreated
  let siteData = {}
  const { site, ...payloadData } = claimPayload.data

  const session = db.client.startSession()

  let claim
  try {
    await session.withTransaction(async () => {
      let claimSiteData = {}

      const siteResult = await processSite({
        site,
        applicationReference,
        createdBy: claimPayload.createdBy,
        species: claimPayload.data.typesOfPoultry,
        db
      })
      claimSiteData = siteResult.claimSiteData
      siteData = siteResult.siteData
      siteCreated = siteResult.created

      const status = await generateClaimStatus(dateOfReview, logger, db)

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
        herd: claimSiteData,
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

  return { claim, siteCreated, siteData }
}

export async function savePoultryClaimAndRelatedData({
  db,
  sbi,
  claimPayload,
  claimReference,
  logger
}) {
  const { dateOfReview } = claimPayload.data
  const { applicationReference } = claimPayload

  const amount = poultryPrice.value

  const { claim, siteCreated, siteData } = await addClaimAndSiteToDatabase({
    sbi,
    applicationReference,
    claimReference,
    amount,
    dateOfReview,
    claimPayload,
    logger,
    db
  })

  return {
    claim,
    siteCreated,
    herdData: {
      ...siteData,
      reasons: []
    }
  }
}

export async function generatePoultryEventsAndComms(claim, application, herdData, herdIdSelected) {
  const { reference: claimReference, status, type } = claim
  const { amount, typesOfPoultry } = claim.data
  const {
    reference: applicationReference,
    organisation: { crn, sbi }
  } = application

  await emitHerdMIEvents({
    sbi,
    herdData,
    herdIdSelected,
    herdGotUpdated: false, // They are created, never updated
    claimReference,
    applicationReference
  })
  const logger = getLogger()

  await publishStatusChangeEvent(logger, {
    crn,
    sbi,
    agreementReference: applicationReference,
    claimReference,
    claimStatus: status,
    claimType: type,
    typesOfPoultry,
    claimAmount: amount,
    dateTime: new Date(),
    herdName: herdData.name // will never be the case we have an unnamed site
  })

  logger.info({
    event: {
      type: 'process-claim',
      reference: `${sbi} - ${applicationReference} - ${claimReference}`,
      outcome: `Status - ${status}`,
      kind: type,
      category: 'Poultry',
      created: new Date()
    }
  })
}
