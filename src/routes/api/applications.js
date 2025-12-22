import joi from 'joi'
import HttpStatus from 'http-status-codes'
import {
  getOWApplication,
  updateOWApplicationStatus
} from '../../repositories/ow-application-repository.js'
import { raiseApplicationStatusEvent } from '../../event-publisher/index.js'
import { STATUS } from 'ffc-ahwr-common-library'

export const applicationHandlers = [
  {
    method: 'PUT',
    path: '/api/applications/{ref}', // TODO: Remove as part of AHWR-1472. Update status of old world application being removed from BO
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        }),
        payload: joi.object({
          status: joi.string().valid(...Object.values(STATUS)),
          user: joi.string(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { status, user, note } = request.payload
        const { ref } = request.params
        const { db } = request

        request.logger.setBindings({ status })

        const application = await getOWApplication(db, ref)
        if (!application) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        if (application.status === status) {
          return h.response().code(HttpStatus.NO_CONTENT)
        }

        const result = await updateOWApplicationStatus({
          db,
          reference: ref,
          status,
          user,
          updatedAt: new Date()
        })

        if (result) {
          await raiseApplicationStatusEvent({
            message: 'Application has been updated',
            application: { ...result, id: result._id.toString() },
            raisedBy: result.updatedBy,
            raisedOn: result.updatedAt,
            note
          })
        }

        return h.response().code(HttpStatus.OK)
      }
    }
  }
]
