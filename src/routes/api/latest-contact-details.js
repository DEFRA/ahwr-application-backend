import joi from 'joi'
import { getApplication } from '../../repositories/application-repository.js'
import { StatusCodes } from 'http-status-codes'

export const latestContactDetailsHandlers = [
  {
    method: 'GET',
    path: '/api/applications/latest-contact-details/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().required()
        })
      },
      handler: async (request, h) => {
        const application = await getApplication({
          db: request.db,
          reference: request.params.ref
        })

        if (!application) {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }

        const { name, orgEmail, farmerName, email } = application.organisation
        return h.response({ name, orgEmail, farmerName, email }).code(StatusCodes.OK)
      }
    }
  }
]
