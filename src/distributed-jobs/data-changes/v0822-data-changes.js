import { raiseHerdEvent } from '../../event-publisher/index.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'
import {
  getClaimByReference,
  updateClaimData,
  updateHerd
} from '../../repositories/claim-repository.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository.js'

// Example supportingData, add to secrets via CDP portal:
//DATA_CHANGE_V0822_DATA = {"datastoreUpdates":[{"claimRef":"FUBC-JTTU-SDQ7","newReason":["onlyHerd"],"oldReason":["uniqueHealthNeeds"]},{"claimRef":"RESH-VASQ-XIXS","newValue":"2025-12-12T00:00:00.000Z","oldValue":"2025-12-11T00:00:00.000Z"},{"claimRef":"REBC-CBLH-B5BB","newValue":"2025-06-02T00:00:00.000Z","oldValue":"2025-06-01T00:00:00.000Z"}],"events":[{"claimRef":"REBC-GI8I-XYW6","sbi":"200219893","applicationRef":"IAHW-9ZXQ-PG89"},{"claimRef":"FUBC-JTTU-SDQ7","sbi":"123456789","applicationRef":"IAHW-G7B4-UTZ5","newReason":["onlyHerd"],"oldReason":["uniqueHealthNeeds"]},{"claimRef":"RESH-VASQ-XIXS","sbi":"107695939","applicationRef":"IAHW-21C5-1417","newValue":"2025-12-12T00:00:00.000Z","oldValue":"2025-12-11T00:00:00.000Z"},{"claimRef":"REBC-CBLH-B5BB","sbi":"106275882","applicationRef":"IAHW-LTYF-KXEC","newValue":"2025-06-02T00:00:00.000Z","oldValue":"2025-06-01T00:00:00.000Z"}]}

const note = 'Request change from Sally Harrison via email on 28th of April 2026'

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)

  const raisedBy = 'Admin2'

  //Data Change 1
  const update1 = datastoreUpdates[0]
  const claim = await getClaimByReference(db, update1.claimRef)
  const herd = await getHerdById(db, claim.herd.id)

  //We update the current version of the herd to indicate it is
  //no longer the current one
  await updateIsCurrentHerd(db, herd.id, false, herd.version)

  delete herd._id
  delete herd.createdAt
  delete herd.updatedAt
  delete herd.updatedBy
  delete herd.migratedRecord
  herd.createdBy = raisedBy
  herd.updatedAt = {}
  herd.version = herd.version + 1
  herd.reasons = update1.newReason
  //We are creating a new version with the new reason
  await createHerd(db, herd)

  const claimHerdData = claim.herd
  claimHerdData.version = herd.version
  claimHerdData.reasons = herd.reasons
  claimHerdData.associatedAt = new Date()

  await updateHerd({
    db,
    claimRef: update1.claimRef,
    updatedProperty: 'herdReasons',
    newValue: update1.newReason,
    oldValue: update1.oldReason,
    note,
    createdBy: raisedBy,
    claimHerdData
  })

  //Data Change 2
  const update2 = datastoreUpdates[1]
  await updateClaimData({
    db,
    reference: update2.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update2.newValue,
    oldValue: update2.oldValue,
    note,
    user: raisedBy,
    updatedAt: new Date()
  })

  //Data Change 3
  const update3 = datastoreUpdates[2]
  await updateClaimData({
    db,
    reference: update3.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update3.newValue,
    oldValue: update3.oldValue,
    note,
    user: raisedBy,
    updatedAt: new Date()
  })
}

export const sendEvents = async (serviceVersion, { events }, db, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'

  const herdAssociatedEvent = 'claim-herdAssociated'
  const herdAssociatedMessage = 'Herd associated with claim updated'

  //Data Change 1
  const event1 = events[0]

  const raisedOn = new Date()
  const raisedOn1 = new Date(raisedOn.getTime() + 1).toISOString()
  const raisedOn2 = new Date(raisedOn.getTime() + 2).toISOString()

  const claim = await getClaimByReference(db, event1.claimRef)
  const herd = await getHerdById(db, claim.herd.id)

  await raiseHerdEvent({
    sbi: event1.sbi,
    message: 'New herd version created',
    type: 'herd-versionCreated',
    raisedBy,
    raisedOn: raisedOn1,
    data: {
      herdId: herd.id,
      herdVersion: herd.version,
      herdName: herd.name,
      herdSpecies: herd.species,
      herdCph: herd.cph,
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
    message: herdAssociatedMessage,
    type: herdAssociatedEvent,
    raisedBy,
    raisedOn: raisedOn2,
    data: {
      herdId: herd.id,
      herdVersion: herd.version,
      reference: event1.claimRef,
      applicationReference: event1.applicationRef
    }
  })

  //Data Change 2
  const event2 = events[1]
  const eventData2 = {
    applicationReference: event2.applicationRef,
    reference: event2.claimRef,
    newValue: event2.newValue,
    oldValue: event2.oldValue,
    updatedProperty: 'dateOfTesting',
    note
  }
  await claimDataUpdateEvent(eventData2, 'claim-testResults', raisedBy, new Date(), event2.sbi)

  //Data Change 3
  const event3 = events[2]
  const eventData4 = {
    applicationReference: event3.applicationRef,
    reference: event3.claimRef,
    newValue: event3.newValue,
    oldValue: event3.oldValue,
    updatedProperty: 'dateOfTesting',
    note
  }
  await claimDataUpdateEvent(eventData4, 'claim-testResults', raisedBy, new Date(), event3.sbi)
}
