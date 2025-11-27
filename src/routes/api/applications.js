import joi from 'joi'
// import { v4 as uuid } from 'uuid'
import {
  getApplication,
  searchApplications,
  updateApplication
} from '../../repositories/application-repository.js'
// import { config } from '../../config/config.js'
// import { sendMessage } from '../../messaging/send-message.js'
import { applicationStatus as APPLICATION_STATUS } from '../../constants/index.js'
import { searchPayloadSchema } from './schema/search-payload.schema.js'
import HttpStatus from 'http-status-codes'
// import { messageQueueConfig } from '../../config/message-queue.js'
import {
  findOWApplication,
  updateOWApplication,
  getOWApplication,
  updateOWApplicationStatus
} from '../../repositories/ow-application-repository.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'
import { raiseApplicationStatusEvent } from '../../event-publisher/index.js'
import { isOWAppRef } from '../../lib/context-helper.js'

// const submitPaymentRequestMsgType = config.get('messageTypes')
// const submitRequestQueue = messageQueueConfig.submitRequestQueue // TODO: get from main config

export const applicationHandlers = [
  {
    method: 'POST',
    path: '/api/applications/search',
    options: {
      validate: {
        payload: joi.object({
          ...searchPayloadSchema,
          sort: joi
            .object({
              field: joi.string().valid().optional().default('CREATEDAT'),
              direction: joi.string().valid().optional().allow('ASC')
            })
            .optional(),
          filter: joi.array().optional()
        }),
        failAction: async (request, h, err) => {
          request.logger.error({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { applications, total } = await searchApplications(
          request.db,
          request.payload.search?.text ?? '',
          request.payload.search?.type,
          request.payload.filter,
          request.payload.offset,
          request.payload.limit,
          request.payload.sort
        )

        return h
          .response({
            applications,
            total
          })
          .code(HttpStatus.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/applications/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        }),
        payload: joi.object({
          status: joi.string().valid(...Object.values(APPLICATION_STATUS)),
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
  },
  {
    method: 'POST',
    path: '/api/applications/claim',
    options: {
      validate: {
        payload: joi.object({
          approved: joi.boolean().required(),
          reference: joi.string().required(),
          user: joi.string().required(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { approved, reference, user, note } = request.payload
        const { db } = request

        request.logger.setBindings({ reference })

        const application = await getOWApplication(db, reference)
        if (!application) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        try {
          let status = APPLICATION_STATUS.rejected

          if (approved) {
            status = APPLICATION_STATUS.readyToPay

            // TODO
            // await sendMessage(
            //   {
            //     reference,
            //     sbi: application.organisation.sbi,
            //     whichReview: application.data.whichReview
            //   },
            //   submitPaymentRequestMsgType,
            //   submitRequestQueue,
            //   { sessionId: uuid() }
            // )
          }

          request.logger.setBindings({ status })

          const result = await updateOWApplicationStatus({
            db,
            reference,
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
        } catch (err) {
          request.logger.setBindings({ error: err })
        }
        return h.response().code(HttpStatus.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/applications/{reference}/data',
    options: {
      validate: {
        params: joi.object({
          reference: joi.string()
        }),
        payload: joi
          .object({
            vetName: joi.string(),
            visitDate: joi.date(),
            vetRcvs: joi.string().pattern(/^\d{6}[\dX]$/i),
            note: joi.string().required(),
            user: joi.string().required()
          })
          .or('vetName', 'visitDate', 'vetRcvs')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
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
    }
  },
  {
    method: 'PUT',
    path: '/api/applications/{ref}/eligible-pii-redaction',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().required()
        }),
        payload: joi.object({
          eligiblePiiRedaction: joi.bool().required(),
          note: joi.string().required(),
          user: joi.string().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { ref } = request.params
        const { eligiblePiiRedaction, user, note } = request.payload
        const { db } = request

        request.logger.setBindings({
          applicationReference: ref,
          eligiblePiiRedaction
        })

        const isOwAppRef = isOWAppRef(ref)

        const application = isOwAppRef
          ? await getOWApplication(db, ref)
          : await getApplication({ db, reference: ref })
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
    }
  }
]
