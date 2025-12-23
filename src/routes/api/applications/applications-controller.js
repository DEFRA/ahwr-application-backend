import Boom from '@hapi/boom'
import HttpStatus, { StatusCodes } from 'http-status-codes'
import {
  createApplication,
  getApplication,
  getApplications,
  getClaims,
  getHerds
} from './applications-service.js'
import { isOWAppRef } from '../../../lib/context-helper.js'
import {
  findOWApplication,
  updateOWApplication
} from '../../../repositories/ow-application-repository.js'
import { updateApplication } from '../../../repositories/application-repository.js'
import { claimDataUpdateEvent } from '../../../event-publisher/claim-data-update-event.js'

export const createApplicationHandler = async (request, h) => {
  try {
    const application = await createApplication({
      applicationRequest: request.payload,
      logger: request.logger,
      db: request.db
    })
    return h.response(application).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error(
      {
        error,
        event: {
          type: 'exception',
          severity: 'error',
          category: 'failed-save'
        }
      },
      'Failed to create application'
    )

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
    request.logger.error(
      {
        error,
        event: {
          type: 'exception',
          severity: 'error',
          category: 'failed-retrieve'
        }
      },
      'Failed to get applications'
    )

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
    request.logger.error(
      {
        error,
        event: {
          type: 'exception',
          severity: 'error',
          category: 'failed-retrieve'
        }
      },
      'Failed to get application claims'
    )

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
    request.logger.error(
      {
        error,
        event: {
          type: 'exception',
          severity: 'error',
          category: 'failed-retrieve'
        }
      },
      'Failed to get application herds'
    )

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
    request.logger.error(
      {
        error,
        event: {
          type: 'exception',
          severity: 'error',
          category: 'failed-retrieve'
        }
      },
      'Failed to get application'
    )

    if (Boom.isBoom(error)) {
      throw error
    }
    throw Boom.internal(error)
  }
}

export const updateEligibleForPiiRedactionHandler = async (request, h) => {
  const { ref } = request.params
  const { eligiblePiiRedaction, user, note } = request.payload
  const { db } = request

  request.logger.setBindings({
    applicationReference: ref,
    eligiblePiiRedaction
  })

  const isOwAppRef = isOWAppRef(ref)

  const application = await getApplication({
    db,
    logger: request.logger,
    applicationReference: ref
  })
  if (!application) {
    return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
  }

  if (application.eligiblePiiRedaction === eligiblePiiRedaction) {
    return h.response().code(HttpStatus.NO_CONTENT)
  }

  const updateData = {
    db: request.db,
    reference: ref,
    updatedPropertyPath: 'eligiblePiiRedaction',
    newValue: eligiblePiiRedaction,
    oldValue: application.eligiblePiiRedaction,
    note,
    user,
    updatedAt: new Date()
  }

  isOwAppRef ? await updateOWApplication(updateData) : await updateApplication(updateData)

  return h.response().code(HttpStatus.NO_CONTENT)
}

export const updateApplicationDataHandler = async (request, h) => {
  const { reference } = request.params
  const { note, user, ...dataPayload } = request.payload

  request.logger.setBindings({ reference, dataPayload })

  const application = await findOWApplication(request.db, reference)
  if (application === null) {
    return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
  }

  const [updatedProperty, newValue] = Object.entries(dataPayload)
    .filter(([key, value]) =>
      key === 'visitDate'
        ? value.getTime() !== application.data.visitDate?.getTime()
        : value !== application.data[key]
    )
    .flat()

  if (updatedProperty === undefined && newValue === undefined) {
    return h.response().code(HttpStatus.NO_CONTENT)
  }

  const oldValue = application.data[updatedProperty] ?? ''
  const updatedAt = new Date()

  await updateOWApplication({
    db: request.db,
    reference,
    updatedPropertyPath: `data.${updatedProperty}`,
    newValue,
    oldValue,
    note,
    user,
    updatedAt
  })

  const eventData = {
    applicationReference: reference,
    reference,
    updatedProperty,
    newValue,
    oldValue,
    note
  }
  await claimDataUpdateEvent(
    eventData,
    `application-${updatedProperty}`,
    user,
    updatedAt,
    application.organisation.sbi
  )

  return h.response().code(HttpStatus.NO_CONTENT)
}
