import Joi from 'joi'
import { getApplicationHistory } from '../../azure-storage/application-status-repository.js'
import {
  findAllClaimUpdateHistory,
  getClaimByReference
} from '../../repositories/claim-repository.js'
import { getFlagsForApplicationIncludingDeleted } from '../../repositories/flag-repository.js'
import { StatusCodes } from 'http-status-codes'
// import { sendMessage as sendMessageViaFetch } from '../../azure/ahwr-event-queue.js'
import { sendMessage as sendMessageViaLib } from '../../azure/send-message.js'
import { config } from '../../config.js'

const eventQueueConfig = config.get('azure.eventQueue')

export const buildFlagEvents = (flags) => {
  const getText = (appliesToMh, state) => {
    const label = appliesToMh ? 'Multiple Herds' : 'non-Multiple Herds'

    return {
      eventType: `Agreement ${state} (${label})`,
      newValue: `${state === 'flagged' ? 'Flagged' : 'Unflagged'} (${label})`,
      oldValue: `${state === 'flagged' ? 'Unflagged' : 'Flagged'}`
    }
  }

  return flags.flatMap(({ dataValues }) => {
    const { appliesToMh } = dataValues

    if (!dataValues.deletedAt) {
      const { eventType, newValue, oldValue } = getText(appliesToMh, 'flagged')

      // Only 1 event needed, as flag was created but not deleted
      return [
        {
          eventType,
          updatedProperty: 'agreementFlag',
          newValue,
          oldValue,
          note: dataValues.note,
          updatedBy: dataValues.createdBy,
          updatedAt: dataValues.createdAt
        }
      ]
    }

    const deleted = getText(appliesToMh, 'unflagged')
    const created = getText(appliesToMh, 'flagged')

    // 2 events needed, as flag was created and then deleted
    return [
      {
        eventType: deleted.eventType,
        updatedProperty: 'agreementFlag',
        newValue: deleted.newValue,
        oldValue: deleted.oldValue,
        note: dataValues.deletedNote,
        updatedBy: dataValues.deletedBy,
        updatedAt: dataValues.deletedAt
      },
      {
        eventType: created.eventType,
        updatedProperty: 'agreementFlag',
        newValue: created.newValue,
        oldValue: created.oldValue,
        note: dataValues.note,
        updatedBy: dataValues.createdBy,
        updatedAt: dataValues.createdAt
      }
    ]
  })
}

export const applicationHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/application/history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        // TODO 1178 TEMP - test comms with Azure
        try {
          // const ahwrEventMessage = {
          //   sourceSystem: 'AHWR',
          //   message: 'Hello from CDP via fetch!'
          // }
          // await sendMessageViaFetch(
          //   request.server,
          //   request.logger,
          //   ahwrEventMessage
          // )
          await sendMessageViaLib(
            {
              message: 'Hello from CDP via lib!'
            },
            'uk.gov.ffc.ahwr.event',
            {
              address: eventQueueConfig.address,
              type: 'queue',
              appInsights: undefined,
              host: eventQueueConfig.host,
              password: eventQueueConfig.password,
              username: eventQueueConfig.username,
              useCredentialChain: false,
              managedIdentityClientId: undefined,
              connectionString: eventQueueConfig.connection
            },
            { sessionId: '456' }
          )
        } catch (error) {
          request.logger.error({ sfdCommunicationError: error })
        }

        const db = request.db
        const reference = request.params.ref
        const history = await getApplicationHistory(db, reference)
        const normalisedHistoryRecords = history.map((record) => {
          const { statusId, note } = JSON.parse(record.Payload)

          return {
            eventType: record.EventType,
            updatedProperty: 'statusId',
            newValue: statusId,
            note,
            updatedBy: record.ChangedBy,
            updatedAt: record.ChangedOn
          }
        })

        const dataUpdates = await findAllClaimUpdateHistory(reference)

        const normalisedDataUpdates = dataUpdates.map((claimUpdate) => ({
          eventType: claimUpdate.eventType,
          updatedProperty: claimUpdate.updatedProperty,
          newValue: claimUpdate.newValue,
          oldValue: claimUpdate.oldValue,
          note: claimUpdate.note,
          updatedBy: claimUpdate.createdBy,
          updatedAt: claimUpdate.createdAt
        }))

        const isOldWorldAgreementReference = reference.includes('AHWR')

        const applicationReference = isOldWorldAgreementReference
          ? reference
          : (await getClaimByReference(db, reference))?.applicationReference

        const flags =
          await getFlagsForApplicationIncludingDeleted(applicationReference)

        const applicationFlagHistory = buildFlagEvents(flags)

        const historyRecords = [
          ...normalisedHistoryRecords,
          ...normalisedDataUpdates,
          ...applicationFlagHistory
        ].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))

        return h.response({ historyRecords }).code(StatusCodes.OK)
      }
    }
  }
]
