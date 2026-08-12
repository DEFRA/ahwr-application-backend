import Joi from 'joi'
import { getClaimByReference } from '../../repositories/claim-repository.js'
import { StatusCodes } from 'http-status-codes'
import {
  normaliseStatusHistory,
  normaliseUpdateHistory,
  buildFlagEvents
} from './application-history.js'
import { getApplicationWithFullFlags } from '../../repositories/application-repository.js'
import { getWithdrawalRequestByClaimReference } from '../../repositories/withdrawal-request-repository.js'
import { STATUS } from 'ffc-ahwr-common-library'

const withWithdrawalDetails = async (db, claimReference, statusHistory) => {
  if (!statusHistory.some((record) => record.newValue === STATUS.WITHDRAWN)) {
    return statusHistory
  }

  const withdrawalRequest = await getWithdrawalRequestByClaimReference({ db, claimReference })
  if (!withdrawalRequest) {
    return statusHistory
  }

  const { reasonForWithdrawal, issueDiscovery, withdrawalDetails } = withdrawalRequest
  return statusHistory.map((record) =>
    record.newValue === STATUS.WITHDRAWN
      ? { ...record, withdrawal: { reasonForWithdrawal, issueDiscovery, withdrawalDetails } }
      : record
  )
}

export const claimHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/claims/{claimRef}/history',
    options: {
      validate: {
        params: Joi.object({
          claimRef: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const db = request.db
        const { claimRef } = request.params

        const claim = await getClaimByReference(db, claimRef)
        const application = await getApplicationWithFullFlags({
          db,
          reference: claim.applicationReference
        })

        const { flags } = application
        const { statusHistory, updateHistory } = claim

        const normalisedStatusHistory = await withWithdrawalDetails(
          db,
          claimRef,
          statusHistory.map(normaliseStatusHistory)
        )
        const normalisedUpdateHistory = updateHistory.map(normaliseUpdateHistory)
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
