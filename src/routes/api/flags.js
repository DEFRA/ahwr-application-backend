import joi from 'joi'
import { getAllFlags } from '../../repositories/flag-repository.js'
import HttpStatus from 'http-status-codes'
import { deleteFlag } from '../../repositories/application-repository.js'
import { deleteOWFlag } from '../../repositories/ow-application-repository.js'
import { raiseApplicationFlagDeletedEvent } from '../../event-publisher/index.js'

export const flagHandlers = [
  {
    method: 'PATCH',
    path: '/api/flags/{flagId}/delete',
    options: {
      validate: {
        params: joi.object({
          flagId: joi.string().valid()
        }),
        payload: joi.object({
          user: joi.string().required(),
          deletedNote: joi.string().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { user, deletedNote } = request.payload
        const { flagId } = request.params

        request.logger.setBindings({ flagId, user })

        let updatedApplication = await deleteFlag(
          request.db,
          flagId,
          user,
          deletedNote
        )

        if (!updatedApplication) {
          updatedApplication = await deleteOWFlag(
            request.db,
            flagId,
            user,
            deletedNote
          )
        }

        if (!updatedApplication) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        const deletedFlag = updatedApplication.flags.find(
          (f) => f.id === flagId
        )

        await raiseApplicationFlagDeletedEvent(
          {
            applicationReference: updatedApplication.applicationReference,
            message: 'Application flag removed',
            flag: {
              id: deletedFlag.id,
              appliesToMh: deletedFlag.appliesToMh,
              deletedNote
            },
            raisedBy: deletedFlag.deletedBy,
            raisedOn: deletedFlag.deletedAt
          },
          updatedApplication.organisation.sbi
        )

        return h.response().code(HttpStatus.NO_CONTENT)
      }
    }
  },
  {
    method: 'GET',
    path: '/api/flags',
    options: {
      handler: async (request, h) => {
        const flags = await getAllFlags(request.db)

        return h.response(flags).code(HttpStatus.OK)
      }
    }
  }
]
