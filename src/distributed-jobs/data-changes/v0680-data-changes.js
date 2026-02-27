import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository.js'
import { addHerdToClaimData, removeHerdFromClaimData } from '../../repositories/claim-repository.js'
import { raiseHerdEvent } from '../../event-publisher/index.js'

export const v0680DatastoreUpdates = async ({ datastoreUpdates }, serviceVersion, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)
  // common data across updates
  const updatedBy = 'Admin2'
  const updateNotes = 'Requested change from Samantha Smith via email on 11th February 2026'
  const oldClaimHerdName = 'Mule Flock'
  const newClaimHerdName = 'Commercial Flock'

  const update1 = datastoreUpdates[0]
  await removeHerdFromClaimData({
    claimRef: update1.claimRef,
    oldClaimHerdName,
    updateNotes,
    updatedBy,
    db
  })

  const update2 = datastoreUpdates[1]
  await removeHerdFromClaimData({
    claimRef: update2.claimRef,
    oldClaimHerdName,
    updateNotes,
    updatedBy,
    db
  })

  // create new herd version and update claim to use it
  const update3 = datastoreUpdates[2]
  const herd = await getHerdById(db, update3.id)
  await updateIsCurrentHerd(db, herd.id, false, herd.version)
  delete herd._id
  delete herd.createdAt
  delete herd.updatedAt
  delete herd.updatedBy
  delete herd.migratedRecord
  herd.createdBy = updatedBy
  herd.updatedAt = {}
  herd.version = herd.version + 1
  herd.name = newClaimHerdName
  await createHerd(db, herd)
  const update4 = datastoreUpdates[3]
  await addHerdToClaimData({
    claimRef: update4.claimRef,
    oldHerdName: oldClaimHerdName,
    claimHerdData: herd,
    note: updateNotes,
    createdBy: updatedBy,
    db
  })
}

export const v0680SendEvents = async ({ events }, serviceVersion, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const unnamedHerdPrefix = 'UNNAMED_HERD_'
  const newClaimHerdName = 'Commercial Flock'

  const event1 = events[0]
  await raiseHerdEvent({
    sbi: event1.sbi,
    message: 'New herd version created',
    type: 'herd-versionCreated',
    raisedBy,
    data: {
      herdId: event1.herdId,
      herdVersion: event1.herdVersion,
      herdName: newClaimHerdName,
      herdSpecies: 'sheep',
      herdCph: event1.herdCph,
      herdReasonManagementNeeds: false,
      herdReasonUniqueHealth: false,
      herdReasonDifferentBreed: false,
      herdReasonOtherPurpose: false,
      herdReasonKeptSeparate: false,
      herdReasonOnlyHerd: true,
      herdReasonOther: false
    }
  })
  await raiseHerdEvent({
    sbi: event1.sbi,
    message: 'Herd associated with claim updated',
    type: 'claim-herdAssociated',
    raisedBy,
    data: {
      herdId: event1.herdId,
      herdVersion: event1.herdVersion,
      reference: event1.claimReference,
      applicationReference: event1.applicationReference
    }
  })

  const event2 = events[1]
  await raiseHerdEvent({
    sbi: event2.sbi,
    message: 'Herd associated with claim updated',
    type: 'claim-herdAssociated',
    raisedBy,
    data: {
      herdId: unnamedHerdPrefix + event2.claimReference,
      herdVersion: 1,
      reference: event2.claimReference,
      applicationReference: event2.applicationReference
    }
  })

  const event3 = events[2]
  await raiseHerdEvent({
    sbi: event3.sbi,
    message: 'Herd associated with claim updated',
    type: 'claim-herdAssociated',
    raisedBy,
    data: {
      herdId: unnamedHerdPrefix + event3.claimReference,
      herdVersion: 1,
      reference: event3.claimReference,
      applicationReference: event3.applicationReference
    }
  })
}
