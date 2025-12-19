import Joi from 'joi'
import { getApplicationsBySbi } from '../../repositories/application-repository.js'
import {
  getAllByApplicationReference,
  updateApplicationValuesAndContactHistory
} from '../../repositories/contact-history-repository.js'
import { sbiSchema } from './schema/sbi.schema.js'
import { StatusCodes } from 'http-status-codes'
import { getOWApplicationsBySbi } from '../../repositories/ow-application-repository.js'
import { APPLICATION_COLLECTION, OW_APPLICATION_COLLECTION } from '../../constants/index.js'

const tenDigitId = Joi.string().pattern(/^\d{10}$/)

export const contactHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/applications/contact-history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const history = await getAllByApplicationReference(
          request.db,
          request.params.ref,
          getCollectionByApplicationReference(request.params.ref)
        )

        return h.response(history?.contactHistory ?? []).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/applications/contact-history',
    options: {
      validate: {
        payload: Joi.object({
          user: Joi.string(),
          farmerName: Joi.string(),
          orgEmail: Joi.string().allow(null),
          email: Joi.string().required().lowercase().email({ tlds: false }),
          address: Joi.string(),
          crn: tenDigitId,
          personRole: Joi.string(),
          sbi: sbiSchema
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err, sbi: request.payload.sbi })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { sbi } = request.payload
        request.logger.setBindings({ sbi })
        const nwApplications = await getApplicationsBySbi(request.db, sbi)
        const owApplications = await getOWApplicationsBySbi(request.db, sbi)
        const applications = nwApplications.concat(owApplications)
        if (!applications.length) {
          return h
            .response('No applications found to update')
            .code(StatusCodes.NOT_FOUND)
            .takeover()
        }
        await Promise.all(
          applications.map(async (application) => {
            const { organisation } = application
            const contactHistory = []
            const orgValues = {}
            if (request.payload.email !== organisation.email) {
              contactHistory.push(createContactHistoryEntry('email', organisation.email, request))
              orgValues['organisation.email'] = request.payload.email
            }

            if (request.payload.orgEmail !== organisation.orgEmail) {
              contactHistory.push(
                createContactHistoryEntry('orgEmail', organisation.orgEmail, request)
              )
              orgValues['organisation.orgEmail'] = request.payload.orgEmail
            }

            if (request.payload.address !== organisation.address) {
              contactHistory.push(
                createContactHistoryEntry('address', organisation.address, request)
              )
              orgValues['organisation.address'] = request.payload.address
            }

            if (request.payload.farmerName !== organisation.farmerName) {
              contactHistory.push(
                createContactHistoryEntry('farmerName', organisation.farmerName, request)
              )
              orgValues['organisation.farmerName'] = request.payload.farmerName
            }

            if (contactHistory.length > 0 || request.payload.crn !== organisation.crn) {
              orgValues['organisation.crn'] = request.payload.crn
              await updateApplicationValuesAndContactHistory({
                db: request.db,
                reference: application.reference,
                updatedPropertyPathsAndValues: orgValues,
                contactHistory,
                updatedBy: request.payload.user,
                collection: getCollectionByApplicationReference(application.reference)
              })
            }
          })
        )
        return h.response().code(StatusCodes.OK)
      }
    }
  }
]

const getCollectionByApplicationReference = (reference) => {
  if (reference.startsWith('AHWR')) {
    return OW_APPLICATION_COLLECTION
  }
  return APPLICATION_COLLECTION
}

const createContactHistoryEntry = (field, oldValue, request) => {
  return {
    field,
    oldValue,
    newValue: request.payload[field],
    crn: request.payload.crn,
    personRole: request.payload.personRole,
    createdAt: new Date()
  }
}
