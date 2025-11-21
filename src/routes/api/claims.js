import joi from 'joi'
import {
  getClaimByReference,
  updateClaimData
} from '../../repositories/claim-repository.js'
import { StatusCodes } from 'http-status-codes'
import { findApplication } from '../../repositories/application-repository.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'

const convertUpdatedPropertyToStandardType = (updatedProperty) => {
  switch (updatedProperty) {
    case 'vetsName':
      return 'vetName'
    case 'vetRCVSNumber':
      return 'vetRcvs'
    case 'dateOfVisit':
      return 'visitDate'
    default:
      return updatedProperty
  }
}

export const claimsHandlers = [
  {
    method: 'PUT',
    path: '/api/claims/{reference}/data',
    options: {
      validate: {
        params: joi.object({
          reference: joi.string()
        }),
        payload: joi
          .object({
            vetsName: joi.string(),
            dateOfVisit: joi.date(),
            vetRCVSNumber: joi.string().pattern(/^\d{6}[\dX]$/i),
            note: joi.string().required(),
            user: joi.string().required()
          })
          .or('vetsName', 'dateOfVisit', 'vetRCVSNumber')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      }
    },
    handler: async (request, h) => {
      const { reference } = request.params
      const { note, user, ...dataPayload } = request.payload
      const { db } = request

      request.logger.setBindings({ reference, dataPayload })

      const claim = await getClaimByReference(db, reference)
      if (claim === null) {
        return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
      }

      const [updatedProperty, newValue] = Object.entries(dataPayload)
        .filter(([key, value]) => value !== claim.data[key])
        .flat()

      if (updatedProperty === undefined && newValue === undefined) {
        return h.response().code(StatusCodes.NO_CONTENT)
      }

      const oldValue = claim.data[updatedProperty]
      const updatedAt = new Date()

      const updatedClaim = await updateClaimData({
        db,
        reference,
        updatedProperty,
        newValue,
        oldValue,
        note,
        user,
        updatedAt
      })

      const application = await findApplication(
        db,
        updatedClaim.applicationReference
      )

      const eventData = {
        applicationReference: updatedClaim.applicationReference,
        reference,
        updatedProperty,
        newValue,
        oldValue,
        note
      }
      await claimDataUpdateEvent(
        eventData,
        `claim-${convertUpdatedPropertyToStandardType(updatedProperty)}`,
        user,
        updatedAt,
        application.organisation.sbi
      )

      return h.response().code(StatusCodes.NO_CONTENT)
    }
  }
]
