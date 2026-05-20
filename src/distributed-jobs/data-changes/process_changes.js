import { raiseClaimEvents } from '../../event-publisher'
import { deleteClaim } from '../../repositories/claim-repository'
import { changeSchema, TYPE_OF_CHANGE } from './schema'

/**
 * @typedef {object} Change
 * @property {string} claimRef - The claim reference
 * @property {string} sbi - Single Business Identifier
 * @property {string} applicationRef - The application reference
 * @property {'deletion' | 'fieldChange'} action - The type of change to process
 * @property {string} [field] - Field name (required for fieldChange)
 * @property {string | string[]} [newValue] - New value (required for fieldChange)
 * @property {string | string[]} [oldValue] - Old value (required for fieldChange)
 * @property {boolean} [skipDataChange] - Skip data change processing
 * @property {boolean} [skipSendEvent] - Skip sending event
 */

/**
 * @typedef {object} ChangeResult
 * @property {boolean} success - Whether the change was processed successfully
 * @property {string} [reason] - Reason for failure if success is false
 */

/**
 * Processes a batch of claim changes (deletions or field updates).
 * Validates each change against the schema, processes the action,
 * and raises events for successful deletions.
 *
 * @param {object} db - MongoDB database connection
 * @param {Change[]} changesToProcess - Array of changes to process
 * @returns {Promise<(Change & ChangeResult)[]>} Array of results with original change data and success status
 */
export const processChanges = async (db, changesToProcess) => {
  const results = await Promise.all(
    changesToProcess.map(async (change) => {
      const { error } = changeSchema.validate(change)
      if (error) {
        return { success: false, ...change, reason: 'Incorrect data structure' }
      }

      switch (change.action) {
        case TYPE_OF_CHANGE.DELETION:
          return await processDeletion(db, change)
        case TYPE_OF_CHANGE.FIELD_CHANGE:
          return { success: true }
        default:
          // This shouldn't ever happen as the scheme gets validated
          return { success: false, ...change, reason: 'Unknown action' }
      }
    })
  )

  return results
}

const processDeletion = async (db, change) => {
  try {
    const deleteResult = await deleteClaim(db, change.claimRef)
    if (deleteResult.deletedCount === 0) {
      return { success: false, ...change, reason: 'Does not exists' }
    } else {
      const withdrawnStatusId = 'WITHDRAWN'
      const withdrawnMessage = 'Claim has been updated'
      const raisedBy = 'Admin2'

      await raiseClaimEvents(
        {
          claim: {
            id: crypto.randomUUID(),
            reference: change.claimRef,
            applicationReference: change.applicationRef,
            status: withdrawnStatusId
          },
          message: withdrawnMessage,
          raisedBy,
          raisedOn: new Date()
        },
        change.sbi
      )
      return { success: true, ...change }
    }
  } catch (error) {
    return { success: false, ...change, reason: error.message }
  }
}
