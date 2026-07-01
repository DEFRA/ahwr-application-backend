import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'
import { raiseClaimEvents, raiseHerdEvent } from '../../event-publisher/index.js'
import {
  deleteClaim,
  getClaimByReference,
  updateClaimData,
  updateHerd
} from '../../repositories/claim-repository.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository.js'
import { changeSchema, TYPE_OF_CHANGE } from './schema.js'

// Fields that are versioned on the herd rather than stored on the claim data
const HERD_PROPERTY_BY_FIELD = {
  herdReasons: 'reasons',
  herdCph: 'cph',
  herdName: 'name'
}

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
          if (HERD_PROPERTY_BY_FIELD[change.field]) {
            return processHerdChange(change, db)
          } else {
            return processDataChange(change, db)
          }
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

const processHerdChange = async (change, db) => {
  const raisedBy = 'Admin2'
  const herdProperty = HERD_PROPERTY_BY_FIELD[change.field]
  try {
    const claim = await getClaimByReference(db, change.claimRef)
    if (claim === null) {
      return { success: false, ...change, reason: 'Does not exists' }
    }

    const herd = await getHerdById(db, claim.herd.id)
    if (herd === null) {
      return { success: false, ...change, reason: 'Herd does not exists' }
    }

    //We update the current version of the herd to indicate it is
    //no longer the current one
    await updateIsCurrentHerd(db, herd.id, false, herd.version)

    await createNewHerdVersion(herd, raisedBy, herdProperty, change, db)

    const claimHerdData = claim.herd
    claimHerdData.version = herd.version
    claimHerdData[herdProperty] = herd[herdProperty]
    claimHerdData.associatedAt = new Date()

    await updateHerd({
      db,
      claimRef: change.claimRef,
      updatedProperty: change.field,
      newValue: change.newValue,
      oldValue: change.oldValue,
      note: `Requested on ${change.dateRequested} by ${change.requester}`,
      createdBy: raisedBy,
      claimHerdData
    })

    await createHerdEvents(change, raisedBy, herd)

    return { success: true, ...change }
  } catch (error) {
    return { success: false, ...change, reason: error.message }
  }
}
async function createHerdEvents(change, raisedBy, herd) {
  const raisedOnBase = new Date()
  const raisedOnVersionCreation = new Date(raisedOnBase.getTime() + 1).toISOString()
  const raisedOnAssociation = new Date(raisedOnBase.getTime() + 2).toISOString()

  await raiseHerdEvent({
    sbi: change.sbi,
    message: 'New herd version created',
    type: 'herd-versionCreated',
    raisedBy,
    raisedOn: raisedOnVersionCreation,
    data: {
      herdId: herd.id,
      herdVersion: herd.version,
      herdName: herd.name,
      herdSpecies: herd.species,
      herdCph: herd.cph,
      herdReasonManagementNeeds: herd.reasons.includes('separateManagementNeeds'),
      herdReasonUniqueHealth: herd.reasons.includes('uniqueHealthNeeds'),
      herdReasonDifferentBreed: herd.reasons.includes('differentBreed'),
      herdReasonOtherPurpose: herd.reasons.includes('differentPurpose'),
      herdReasonKeptSeparate: herd.reasons.includes('keptSeparate'),
      herdReasonOnlyHerd: herd.reasons.includes('onlyHerd'),
      herdReasonOther: herd.reasons.includes('other')
    }
  })

  await raiseHerdEvent({
    sbi: change.sbi,
    message: 'Herd associated with claim updated',
    type: 'claim-herdAssociated',
    raisedBy,
    raisedOn: raisedOnAssociation,
    data: {
      herdId: herd.id,
      herdVersion: herd.version,
      reference: change.claimRef,
      applicationReference: change.applicationRef
    }
  })
}

async function createNewHerdVersion(herd, raisedBy, herdProperty, change, db) {
  delete herd._id
  delete herd.createdAt
  delete herd.updatedAt
  delete herd.updatedBy
  delete herd.migratedRecord
  herd.createdBy = raisedBy
  herd.updatedAt = {}
  herd.version = herd.version + 1
  herd[herdProperty] = change.newValue
  //We are creating a new version with the new field
  await createHerd(db, herd)
}
