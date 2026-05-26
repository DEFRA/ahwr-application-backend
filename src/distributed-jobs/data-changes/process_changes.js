import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'
import { raiseClaimEvents } from '../../event-publisher/index.js'
import { deleteClaim, updateClaimData } from '../../repositories/claim-repository.js'
import { changeSchema, TYPE_OF_CHANGE } from './schema.js'

/**
 * @typedef {object} Change
 * @property {string} claimRef - The claim reference
 * @property {string} sbi - Single Business Identifier
 * @property {string} applicationRef - The application reference
 * @property {'deletion' | 'fieldChange'} action - The type of change to process
 * @property {string} [field] - Field name (required for fieldChange)
 * @property {string} [dateRequested] - The day when the request was done in ISO 8601
 * @property {string} [requester] - Who has made the request
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
 * and raises events for successful actions.
 *
 * @param {Change[]} changesToProcess - Array of changes to process
 * @param {object} db - MongoDB database connection
 * @param {object} logger - Hapi logger
 * @returns {Promise<(Change & ChangeResult)[]>} Array of results with original change data and success status
 */
export const processChanges = async (changesToProcess, db, logger) => {
  const results = await Promise.all(
    changesToProcess.map(async (change) => {
      const { error } = changeSchema.validate(change)
      if (error) {
        return { success: false, ...change, reason: 'Incorrect data structure' }
      }

      switch (change.action) {
        case TYPE_OF_CHANGE.DELETION:
          return processDeletion(change, db)
        case TYPE_OF_CHANGE.FIELD_CHANGE:
          return processDataChange(change, db)
        default:
          // This shouldn't ever happen as the scheme gets validated
          return { success: false, ...change, reason: 'Unknown action' }
      }
    })
  )

  results.forEach((result) => {
    if (result.success) {
      logger.info(`${result.claimRef} has processed successfully`)
    } else {
      logger.info(`${result.claimRef} has failed because ${result.reason}`)
    }
  })

  return results
}

const processDeletion = async (change, db) => {
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

const processDataChange = async (change, db) => {
  const raisedBy = 'Admin2'
  try {
    const result = await updateClaimData({
      db,
      reference: change.claimRef,

      updatedProperty: change.field,
      newValue: change.newValue,
      oldValue: change.oldValue,
      note: `Requested on ${change.dateRequested} by ${change.requester}`,
      user: raisedBy,
      updatedAt: new Date()
    })

    if (result === null) {
      return { success: false, ...change, reason: 'Does not exists' }
    }

    await claimDataUpdateEvent(
      {
        applicationReference: change.applicationRef,
        reference: change.claimRef,
        newValue: change.newValue,
        oldValue: change.oldValue,
        updatedProperty: change.field,
        note: `Requested on ${change.dateRequested} by ${change.requester}`
      },
      `claim-${change.field}`,
      raisedBy,
      new Date(),
      change.sbi
    )

    return { success: true, ...change }
  } catch (error) {
    return { success: false, ...change, reason: 'Connection failed' }
  }
}

// Examples of data changes to be implemented
// -  //Data Change 1
// -  const update1 = datastoreUpdates[0]
// -  const claim = await getClaimByReference(db, update1.claimRef)
// -  const herd = await getHerdById(db, claim.herd.id)
// -
// -  //We update the current version of the herd to indicate it is
// -  //no longer the current one
// -  await updateIsCurrentHerd(db, herd.id, false, herd.version)
// -
// -  delete herd._id
// -  delete herd.createdAt
// -  delete herd.updatedAt
// -  delete herd.updatedBy
// -  delete herd.migratedRecord
// -  herd.createdBy = raisedBy
// -  herd.updatedAt = {}
// -  herd.version = herd.version + 1
// -  herd.reasons = update1.newReason
// -  //We are creating a new version with the new reason
// -  await createHerd(db, herd)
// -
// -  const claimHerdData = claim.herd
// -  claimHerdData.version = herd.version
// -  claimHerdData.reasons = herd.reasons
// -  claimHerdData.associatedAt = new Date()
// -
// -  await updateHerd({
// -    db,
// -    claimRef: update1.claimRef,
// -    updatedProperty: 'herdReasons',
// -    newValue: update1.newReason,
// -    oldValue: update1.oldReason,
// -    note,
// -    createdBy: raisedBy,
// -    claimHerdData
// -  })
// -
// -  //Data Change 2
// -  const update2 = datastoreUpdates[1]
// -  await updateClaimData({
// -    db,
// -    reference: update2.claimRef,
// -    updatedProperty: 'dateOfTesting',
// -    newValue: update2.newValue,
// -    oldValue: update2.oldValue,
// -    note,
// -    user: raisedBy,
// -    updatedAt: new Date()
// -  })
// -  const herdAssociatedEvent = 'claim-herdAssociated'
// -  const herdAssociatedMessage = 'Herd associated with claim updated'
// -
// -  //Data Change 1
// -  const event1 = events[0]
// -
// -  const raisedOn = new Date()
// -  const raisedOn1 = new Date(raisedOn.getTime() + 1).toISOString()
// -  const raisedOn2 = new Date(raisedOn.getTime() + 2).toISOString()
// -
// -  const claim = await getClaimByReference(db, event1.claimRef)
// -  const herd = await getHerdById(db, claim.herd.id)
// -
// -  await raiseHerdEvent({
// -    sbi: event1.sbi,
// -    message: 'New herd version created',
// -    type: 'herd-versionCreated',
// -    raisedBy,
// -    raisedOn: raisedOn1,
// -    data: {
// -      herdId: herd.id,
// -      herdVersion: herd.version,
// -      herdName: herd.name,
// -      herdSpecies: herd.species,
// -      herdCph: herd.cph,
// -      herdReasonManagementNeeds: false,
// -      herdReasonUniqueHealth: false,
// -      herdReasonDifferentBreed: false,
// -      herdReasonOtherPurpose: false,
// -      herdReasonKeptSeparate: false,
// -      herdReasonOnlyHerd: true,
// -      herdReasonOther: false
// -    }
// -  })
// -
// -  await raiseHerdEvent({
// -    sbi: event1.sbi,
// -    message: herdAssociatedMessage,
// -    type: herdAssociatedEvent,
// -    raisedBy,
// -    raisedOn: raisedOn2,
// -    data: {
// -      herdId: herd.id,
// -      herdVersion: herd.version,
// -      reference: event1.claimRef,
// -      applicationReference: event1.applicationRef
// -    }
// -  })
// -
// -  //Data Change 2
// -  const event2 = events[1]
// -  const eventData2 = {
// -    applicationReference: event2.applicationRef,
// -    reference: event2.claimRef,
// -    newValue: event2.newValue,
// -    oldValue: event2.oldValue,
// -    updatedProperty: 'dateOfTesting',
// -    note
// -  }
// -  await claimDataUpdateEvent(eventData2, 'claim-testResults', raisedBy, new Date(), event2.sbi)
