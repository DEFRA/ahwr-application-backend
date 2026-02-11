import { createApplicationReference } from '../../../lib/create-reference.js'
import * as appRepo from '../../../repositories/application-repository.js'
import * as owAppRepo from '../../../repositories/ow-application-repository.js'
import { getByApplicationReference } from '../../../repositories/claim-repository.js'
import { getHerdsByAppRefAndSpecies } from '../../../repositories/herd-repository.js'
import Boom from '@hapi/boom'
import { raiseApplicationStatusEvent } from '../../../event-publisher/index.js'
import { publishDocumentRequestEvent } from '../../../messaging/publish-outbound-notification.js'
import { AHWR_SCHEME, STATUS } from 'ffc-ahwr-common-library'

const isPreviousApplicationRelevant = (application) => {
  return application && ![STATUS.WITHDRAWN, STATUS.NOT_AGREED].includes(application.status)
}

const buildApplication = (applicationRequest) => {
  const status = applicationRequest.offerStatus === 'rejected' ? STATUS.NOT_AGREED : STATUS.AGREED
  const createdAt = new Date()
  const createdBy = 'admin'

  return {
    reference: createApplicationReference(applicationRequest.reference),
    data: {
      reference: applicationRequest.reference,
      declaration: applicationRequest.declaration,
      offerStatus: applicationRequest.offerStatus,
      confirmCheckDetails: applicationRequest.confirmCheckDetails
    },
    organisation: applicationRequest.organisation,
    createdBy,
    createdAt,
    status,
    contactHistory: applicationRequest.contactHistory || [],
    statusHistory: [
      {
        status,
        createdBy,
        createdAt
      }
    ],
    updateHistory: [],
    flags: [],
    redactionHistory: {},
    eligiblePiiRedaction: true
  }
}

export const createApplication = async ({ applicationRequest, logger, db }) => {
  logger.setBindings({ sbi: applicationRequest.organisation.sbi })

  const applications = await appRepo.getApplicationsBySbi(db, applicationRequest.organisation.sbi)
  const latestApplication = applications?.[0]
  if (isPreviousApplicationRelevant(latestApplication)) {
    throw new Error(
      `Recent application already exists: ${JSON.stringify({
        reference: latestApplication.reference,
        createdAt: latestApplication.createdAt
      })}`
    )
  }

  const application = buildApplication(applicationRequest)

  const result = await appRepo.createApplication(db, application)

  if (application.data.offerStatus === 'accepted') {
    try {
      const orgEmail = application.organisation.orgEmail
      await publishDocumentRequestEvent(logger, {
        reference: application.reference,
        sbi: application.organisation.sbi,
        startDate: application.createdAt.toISOString(),
        userType: application.organisation.userType,
        email: application.organisation.email,
        farmerName: application.organisation.farmerName,
        name: application.organisation.name,
        crn: application.organisation.crn,
        scheme: AHWR_SCHEME,
        ...(orgEmail && { orgEmail })
      })
    } catch (error) {
      logger.error(error, 'Failed to request application document generation')
    }
  }

  await raiseApplicationStatusEvent({
    message: 'New application has been created',
    application: { ...application, id: result.insertedId.toString() },
    raisedBy: application.createdBy,
    raisedOn: application.createdAt
  })

  logger.info({
    event: {
      type: 'process-application-api',
      reference: application.reference,
      outcome: 'true',
      category: `status: ${application.data.offerStatus} sbi:${application.organisation.sbi}`
    }
  })

  return {
    applicationReference: application.reference
  }
}

export const getApplications = async ({ sbi, logger, db }) => {
  logger.setBindings({ sbi })

  const nwResult = (await appRepo.getApplicationsBySbi(db, sbi)).map((app) =>
    mapApplicationForResponse(app, 'EE')
  )

  const owResult = (await owAppRepo.getOWApplicationsBySbi(db, sbi)).map((app) =>
    mapApplicationForResponse(app, 'VV')
  )

  return [...nwResult, ...owResult]
}

const mapApplicationForResponse = (app, type) => {
  return {
    type,
    reference: app.reference,
    data: app.data,
    status: app.status,
    createdAt: app.createdAt,
    organisation: app.organisation,
    redacted: app.redacted,
    flags: app.flags
  }
}

export const getClaims = async ({ db, logger, applicationReference, typeOfLivestock }) => {
  logger.setBindings({ applicationReference, typeOfLivestock })

  const result = await getByApplicationReference({
    db,
    applicationReference,
    typeOfLivestock
  })

  return result.map((claim) => ({
    reference: claim.reference,
    applicationReference: claim.applicationReference,
    createdAt: claim.createdAt,
    type: claim.type,
    data: claim.data,
    status: claim.status,
    herd: {
      id: claim.herd.id,
      cph: claim.herd.cph,
      name: claim.herd.name,
      reasons: claim.herd.reasons,
      version: claim.herd.version
    }
  }))
}

export const getHerds = async ({ db, logger, applicationReference, species }) => {
  logger.setBindings({ applicationReference, species })

  const result = await getHerdsByAppRefAndSpecies({
    db,
    applicationReference,
    species
  })

  const herds = result.map((herd) => ({
    id: herd.id,
    version: herd.version,
    name: herd.name,
    cph: herd.cph,
    reasons: herd.reasons,
    species: herd.species
  }))

  return {
    herds
  }
}

const isOWApplication = (applicationReference) => applicationReference.startsWith('AHWR')

const getOWApplication = async (db, applicationReference) => {
  const result = await owAppRepo.getOWApplication(db, applicationReference)
  if (!result) {
    throw Boom.notFound('Application not found')
  }

  return {
    type: 'VV',
    reference: result.reference,
    data: result.data,
    status: result.status,
    createdAt: result.createdAt,
    organisation: result.organisation,
    redacted: result.redactionHistory?.success === 'Y',
    updateHistory: result.updateHistory,
    statusHistory: result.statusHistory,
    contactHistory: result.contactHistory,
    flags: result.flags,
    eligiblePiiRedaction: result.eligiblePiiRedaction
  }
}

export const getApplication = async ({ db, logger, applicationReference }) => {
  logger.setBindings({ applicationReference })

  if (isOWApplication(applicationReference)) {
    return getOWApplication(db, applicationReference)
  }

  const result = await appRepo.getApplication({
    db,
    reference: applicationReference
  })
  if (!result) {
    throw Boom.notFound('Application not found')
  }

  return {
    type: 'EE',
    reference: result.reference,
    data: result.data,
    status: result.status,
    createdAt: result.createdAt,
    organisation: result.organisation,
    redacted: result.redacted,
    updateHistory: result.updateHistory,
    statusHistory: result.statusHistory,
    contactHistory: result.contactHistory,
    flags: result.flags,
    eligiblePiiRedaction: result.eligiblePiiRedaction
  }
}
