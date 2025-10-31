import Joi from 'joi'
import { getClaimByReference } from '../../repositories/claim-repository.js'
import { StatusCodes } from 'http-status-codes'
import { getApplication } from '../../repositories/application-repository.js'
import { getApplication as getOWApplication } from '../../repositories/ow-application-repository.js'

export const buildFlagEvents = (flags) => {
  const getText = (appliesToMh, state) => {
    const label = appliesToMh ? 'Multiple Herds' : 'non-Multiple Herds'

    return {
      eventType: `Agreement ${state} (${label})`,
      newValue: `${state === 'flagged' ? 'Flagged' : 'Unflagged'} (${label})`,
      oldValue: `${state === 'flagged' ? 'Unflagged' : 'Flagged'}`
    }
  }

  return flags.flatMap((flag) => {
    const {
      appliesToMh,
      note,
      createdBy,
      createdAt,
      deletedAt,
      deletedNote,
      deletedBy
    } = flag

    if (!deletedAt) {
      const { eventType, newValue, oldValue } = getText(appliesToMh, 'flagged')

      // Only 1 event needed, as flag was created but not deleted
      return [
        {
          eventType,
          updatedProperty: 'agreementFlag',
          newValue,
          oldValue,
          note,
          updatedBy: createdBy,
          updatedAt: createdAt
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
        note: deletedNote,
        updatedBy: deletedBy,
        updatedAt: deletedAt
      },
      {
        eventType: created.eventType,
        updatedProperty: 'agreementFlag',
        newValue: created.newValue,
        oldValue: created.oldValue,
        note,
        updatedBy: createdBy,
        updatedAt: createdAt
      }
    ]
  })
}

const normaliseUpdateHistory = (update) => ({
  eventType: update.eventType,
  updatedProperty: update.updatedProperty,
  newValue: update.newValue,
  oldValue: update.oldValue,
  note: update.note,
  updatedBy: update.createdBy,
  updatedAt: update.createdAt
})

const normaliseStatusHistory = ({ status, note, createdBy, createdAt }) => ({
  eventType: 'status-updated',
  updatedProperty: 'status',
  newValue: status,
  note,
  updatedBy: createdBy,
  updatedAt: createdAt
})

export const applicationHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/applications/{claimOrOWAppRef}/history',
    options: {
      validate: {
        params: Joi.object({
          claimOrOWAppRef: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const db = request.db
        const claimOrOWAppRef = request.params.claimOrOWAppRef
        const isOWAppRef = claimOrOWAppRef.includes('AHWR')

        let statusHistory
        let updateHistory
        let flags

        if (isOWAppRef) {
          const application = await getOWApplication(db, claimOrOWAppRef)

          statusHistory = application.statusHistory
          updateHistory = application.updateHistory
          flags = application.flags
        } else {
          const claim = await getClaimByReference(db, claimOrOWAppRef)
          const application = await getApplication({
            db,
            reference: claim.applicationReference,
            includeDeletedFlags: true
          })

          statusHistory = claim.statusHistory
          updateHistory = claim.updateHistory
          flags = application.flags
        }

        const normalisedStatusHistory = statusHistory.map(
          normaliseStatusHistory
        )
        const normalisedUpdateHistory = updateHistory.map(
          normaliseUpdateHistory
        )
        const normalisedFlagHistory = buildFlagEvents(flags)

        const historyRecords = [
          ...normalisedStatusHistory,
          ...normalisedUpdateHistory,
          ...normalisedFlagHistory
        ].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))

        return h.response({ historyRecords }).code(StatusCodes.OK)
      }
    }
  }
]
