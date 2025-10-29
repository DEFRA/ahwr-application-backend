import { applicationStatus } from '../../../constants/index.js'
// import { requestApplicationDocumentGenerateAndEmail } from '../../../lib/request-application-document-generate.js'
import { createApplicationReference } from '../../../lib/create-reference.js'
import * as appRepo from '../../../repositories/application-repository.js'
import * as owAppRepo from '../../../repositories/ow-application-repository.js'
import { getByApplicationReference } from '../../../repositories/claim-repository.js'
import { getHerdsByAppRefAndSpecies } from '../../../repositories/herd-repository.js'
import Boom from '@hapi/boom'

const isPreviousApplicationRelevant = (application) => {
  return (
    application &&
    ![applicationStatus.withdrawn, applicationStatus.notAgreed].includes(
      application.status
    )
  )
}

export const createApplication = async ({ applicationRequest, logger, db }) => {
  logger.setBindings({ sbi: applicationRequest.organisation.sbi })

  const applications = await appRepo.getApplicationsBySbi(
    db,
    applicationRequest.organisation.sbi
  )
  const latestApplication = applications?.[0]
  if (isPreviousApplicationRelevant(latestApplication)) {
    throw new Error(
      `Recent application already exists: ${JSON.stringify({
        reference: latestApplication.reference,
        createdAt: latestApplication.createdAt
      })}`
    )
  }

  const application = {
    reference: createApplicationReference(applicationRequest.reference),
    data: {
      reference: applicationRequest.reference,
      declaration: applicationRequest.declaration,
      offerStatus: applicationRequest.offerStatus,
      confirmCheckDetails: applicationRequest.confirmCheckDetails
    },
    organisation: applicationRequest.organisation,
    contactHistory: applicationRequest.contactHistory,
    createdBy: 'admin',
    createdAt: new Date(),
    status:
      applicationRequest.offerStatus === 'rejected'
        ? applicationStatus.notAgreed
        : applicationStatus.agreed
  }
  await appRepo.createApplication(db, application)

  // TODO
  // if (application.data.offerStatus === 'accepted') {
  //   try {
  //     await requestApplicationDocumentGenerateAndEmail({
  //       reference: application.reference,
  //       sbi: application.organisation.sbi,
  //       startDate: application.createdAt,
  //       userType: application.organisation.userType,
  //       email: application.organisation.email,
  //       farmerName: application.organisation.farmerName,
  //       orgData: {
  //         orgName: application.organisation.name,
  //         orgEmail: application.organisation.orgEmail,
  //         crn: application.organisation.crn
  //       }
  //     })
  //   } catch (error) {
  //     logger.error(
  //       error,
  //       'Failed to request application document generation and email'
  //     )
  //   }
  // }

  // TODO
  // appInsights.defaultClient.trackEvent({
  //     name: 'process-application-api',
  //     properties: {
  //         status: application.data.offerStatus,
  //         reference: application.data.applicationReference,
  //         sbi: application.organisation.sbi
  //     }
  // })

  return {
    applicationReference: application.reference
  }
}

export const getApplications = async ({ sbi, logger, db }) => {
  logger.setBindings({ sbi })

  const result = await appRepo.getApplicationsBySbi(db, sbi)

  return result.map((app) => ({
    type: 'EE',
    reference: app.reference,
    data: app.data,
    status: app.status,
    createdAt: app.createdAt,
    organisation: app.organisation,
    redacted: app.redacted
  }))
}

export const getClaims = async ({
  db,
  logger,
  applicationReference,
  typeOfLivestock
}) => {
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
      cph: claim.herd.cph,
      name: claim.herd.name,
      reasons: claim.herd.reasons
    }
  }))
}

export const getHerds = async ({
  db,
  logger,
  applicationReference,
  species
}) => {
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

const isOWApplication = (applicationReference) =>
  applicationReference.startsWith('AHWR')

const getOWApplication = async (db, applicationReference) => {
  const result = await owAppRepo.getApplication(db, applicationReference)
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
    redacted: result.redacted,
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

  const result = await appRepo.getApplication(db, applicationReference)
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
