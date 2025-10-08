import { getLatestApplicationsBySbi } from '../../../repositories/application-repository'
import { applicationStatus } from '../../../constants/index.js'
import { requestApplicationDocumentGenerateAndEmail } from '../../../lib/request-application-document-generate.js'
import appInsights from 'applicationinsights'
import { createApplicationReference } from '../../../lib/create-reference.js'
import * as repo from './application-repository.js'
import { Status } from './application-model.js'

const isPreviousApplicationRelevant = (existingApplication) => {
  return (
    existingApplication?.type === 'EE' &&
    ![applicationStatus.withdrawn, applicationStatus.notAgreed].includes(
      existingApplication?.statusId
    )
  )
}

export const createApplication = async ({ applicationRequest, logger, db }) => {
  logger.setBindings({ sbi: applicationRequest.sbi })

  const existingApplication = await repo.getLatestApplicationBySbi(
    db,
    applicationRequest.organisation.sbi
  )
  if (isPreviousApplicationRelevant(existingApplication)) {
    throw new Error(
      `Recent application already exists: ${JSON.stringify({
        reference: existingApplication.dataValues.reference,
        createdAt: existingApplication.dataValues.createdAt
      })}`
    )
  }

  const application = {
    ...applicationRequest,
    reference: createApplicationReference(applicationRequest.reference),
    createdBy: 'admin',
    createdAt: new Date(),
    statusId:
      applicationRequest.offerStatus === 'rejected'
        ? Status.NOT_AGREED
        : Status.AGREED
  }
  await repo.createApplication(application)

  if (application.data.offerStatus === 'accepted') {
    try {
      await requestApplicationDocumentGenerateAndEmail({
        reference: application.reference,
        sbi: application.organisation.sbi,
        startDate: application.createdAt,
        userType: application.organisation.userType,
        email: application.organisation.email,
        farmerName: application.organisation.farmerName,
        orgData: {
          orgName: application.organisation.name,
          orgEmail: application.organisation.orgEmail,
          crn: application.organisation.crn
        }
      })
    } catch (error) {
      logger.error(
        error,
        'Failed to request application document generation and email'
      )
    }
  }

  appInsights.defaultClient.trackEvent({
    name: 'process-application-api',
    properties: {
      status: application.data.offerStatus,
      reference: application.data.applicationReference,
      sbi: application.organisation.sbi
    }
  })

  return {
    applicationReference: application.applicationReference
  }
}

export const getApplications = async ({ sbi, logger, db }) => {
  logger.setBindings({ sbi })
  return getLatestApplicationsBySbi(db, sbi)
}
