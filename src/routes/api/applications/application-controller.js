import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import { createApplication, getApplications } from './application-service.js'
import appInsights from 'applicationinsights'

export const createApplicationHandler = async (request, h) => {
  try {
    const application = await createApplication({
      applicationRequest: request.payload,
      logger: request.logger,
      db: request.db
    })
    return h.response(application).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to process application')
    appInsights.defaultClient.trackException({ exception: err })
    throw Boom.internal(err)
  }
}

export const getApplicationsHandler = async (request, h) => {
  try {
    const applications = await getApplications({
      sbi: request.query.sbi,
      logger: request.logger,
      db: request.db
    })
    return h.response(applications).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get applications')
    appInsights.defaultClient.trackException({ exception: error })
    throw Boom.internal(error)
  }
}
