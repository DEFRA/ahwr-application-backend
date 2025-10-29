import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import {
  createApplication,
  getApplication,
  getApplications,
  getClaims,
  getHerds
} from './applications-service.js'

export const createApplicationHandler = async (request, h) => {
  try {
    const application = await createApplication({
      applicationRequest: request.payload,
      logger: request.logger,
      db: request.db
    })
    return h.response(application).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to create application')
    // TODO
    // appInsights.defaultClient.trackException({ exception: err })

    if (Boom.isBoom(error)) {
      throw error
    }
    throw Boom.internal(error)
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
    // TODO
    // appInsights.defaultClient.trackException({ exception: error })

    if (Boom.isBoom(error)) {
      throw error
    }
    throw Boom.internal(error)
  }
}

export const getApplicationClaimsHandler = async (request, h) => {
  try {
    const { typeOfLivestock } = request.query
    const { applicationReference } = request.params

    const claims = await getClaims({
      db: request.db,
      logger: request.logger,
      applicationReference,
      typeOfLivestock
    })

    return h.response(claims).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get application claims')
    // TODO
    // appInsights.defaultClient.trackException({ exception: error })

    if (Boom.isBoom(error)) {
      throw error
    }
    throw Boom.internal(error)
  }
}

export const getApplicationHerdsHandler = async (request, h) => {
  try {
    const { applicationReference } = request.params
    const { species } = request.query

    const claims = await getHerds({
      db: request.db,
      logger: request.logger,
      applicationReference,
      species
    })

    return h.response(claims).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get application herds')
    // TODO
    // appInsights.defaultClient.trackException({ exception: error })

    if (Boom.isBoom(error)) {
      throw error
    }
    throw Boom.internal(error)
  }
}

export const getApplicationHandler = async (request, h) => {
  try {
    const { applicationReference } = request.params

    const application = await getApplication({
      db: request.db,
      logger: request.logger,
      applicationReference
    })

    return h.response(application).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get application')
    // TODO
    // appInsights.defaultClient.trackException({ exception: error })

    if (Boom.isBoom(error)) {
      throw error
    }
    throw Boom.internal(error)
  }
}
