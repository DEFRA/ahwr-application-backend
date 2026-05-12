import { v4 as uuid } from 'uuid'

import { raiseClaimEvents, raiseHerdEvent } from '../../event-publisher'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event'
import {
  deleteClaim,
  getClaimByReference,
  updateClaimData,
  updateHerd
} from '../../repositories/claim-repository'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0723_DATA={"datastoreUpdates":[{"claimRef":"RESH-YFE2-A4ZB"},{"claimRef":"RESH-9TBQ-E4TP"},{"claimRef":"RESH-4SUJ-BDWB"},{"claimRef":"RESH-6PRX-MWVV"},{"claimRef":"RESH-R6LQ-ZP8W","newValue":"887761","oldValue":"887760"},{"claimRef":"RESH-B7L3-5PTA","newValue":"887771","oldValue":"887770"}],"events":[{"claimRef":"RESH-YFE2-A4ZB","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-9TBQ-E4TP","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-4SUJ-BDWB","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-6PRX-MWVV","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-R6LQ-ZP8W","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD","newValue":"887761","oldValue":"887760"},{"claimRef":"RESH-B7L3-5PTA","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD","newValue":"887771","oldValue":"887770"}]}

const noteOne = 'Request change from Sally Harrison via email on 5th of May 2026'
const noteTwo = 'Request change from Sally Harrison via email on 28th of April 2026'

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)

  const raisedBy = 'Admin2'

  //Data Change 1
  await deleteClaim(db, datastoreUpdates[0].claimRef)

  //Data Change 2
  const update2 = datastoreUpdates[1]
  const claim = await getClaimByReference(db, update2.claimRef)
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
  herd.reasons = update2.newReason
  //We are creating a new version with the new reason
  await createHerd(db, herd)

  const claimHerdData = claim.herd
  claimHerdData.version = herd.version
  claimHerdData.reasons = herd.reasons
  claimHerdData.associatedAt = new Date()

  await updateHerd({
    db,
    claimRef: update2.claimRef,
    updatedProperty: 'reasons',
    newValue: update2.newReason,
    oldValue: update2.oldReason,
    note: noteTwo,
    createdBy: raisedBy,
    claimHerdData
  })

  //Data Change 3
  const update3 = datastoreUpdates[2]
  await updateClaimData({
    db,
    reference: update3.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update3.newValue,
    oldValue: update3.oldValue,
    note: noteTwo,
    user: raisedBy,
    updatedAt: new Date()
  })

  //Data Change 4
  const update4 = datastoreUpdates[3]
  await updateClaimData({
    db,
    reference: update4.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update4.newValue,
    oldValue: update4.oldValue,
    note: noteTwo,
    user: raisedBy,
    updatedAt: new Date()
  })
}

export const sendEvents = async (serviceVersion, { events }, db, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const withdrawnStatusId = 'WITHDRAWN'
  const withdrawnMessage = 'Claim with wrong dates'

  const herdAssociatedEvent = 'claim-herdAssociated'
  const herdAssociatedMessage = 'Herd associated with claim updated'

  //Data Change 1
  const event1 = events[0]
  await raiseClaimEvents(
    {
      claim: {
        id: uuid(),
        reference: event1.claimRef,
        applicationReference: event1.applicationRef,
        status: withdrawnStatusId
      },
      message: withdrawnMessage,
      raisedBy,
      raisedOn: new Date()
    },
    event1.sbi
  )

  //Data Change 2
  const event2 = events[1]

  const raisedOn = new Date()
  const raisedOn1 = new Date(raisedOn.getTime() + 1).toISOString()
  const raisedOn2 = new Date(raisedOn.getTime() + 2).toISOString()

  const herd = await getHerdById(db, event2.id)

  await raiseHerdEvent({
    sbi: event2.sbi,
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
    sbi: event2.sbi,
    message: herdAssociatedMessage,
    type: herdAssociatedEvent,
    raisedBy,
    raisedOn: raisedOn2,
    data: {
      herdId: herd.id,
      herdVersion: herd.version,
      reference: event2.claimRef,
      applicationReference: event2.applicationRef
    }
  })

  //Data Change 3
  const event3 = events[2]
  const eventData3 = {
    applicationReference: event3.applicationRef,
    reference: event3.claimRef,
    newValue: event3.newValue,
    oldValue: event3.oldValue,
    updatedProperty: 'dateOfTesting',
    note: noteOne
  }
  await claimDataUpdateEvent(eventData3, 'claim-testResults', raisedBy, new Date(), event3.sbi)

  //Data Change 4
  const event4 = events[3]
  const eventData4 = {
    applicationReference: event4.applicationRef,
    reference: event4.claimRef,
    newValue: event4.newValue,
    oldValue: event4.oldValue,
    updatedProperty: 'dateOfTesting',
    note: noteOne
  }
  await claimDataUpdateEvent(eventData4, 'claim-testResults', raisedBy, new Date(), event4.sbi)
}
