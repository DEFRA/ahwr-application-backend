import { v4 as uuid } from 'uuid'
import {
  deleteClaim,
  getClaimByReference,
  updateClaimData,
  updateHerd
} from '../../repositories/claim-repository.js'
import { raiseClaimEvents, raiseHerdEvent } from '../../event-publisher/index.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository.js'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0723_DATA={"datastoreUpdates":[{"claimRef":"RESH-YFE2-A4ZB"},{"claimRef":"RESH-9TBQ-E4TP"},{"claimRef":"RESH-4SUJ-BDWB"},{"claimRef":"RESH-6PRX-MWVV"},{"claimRef":"RESH-R6LQ-ZP8W","newValue":"887761","oldValue":"887760"},{"claimRef":"RESH-B7L3-5PTA","newValue":"887771","oldValue":"887770"}],"events":[{"claimRef":"RESH-YFE2-A4ZB","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-9TBQ-E4TP","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-4SUJ-BDWB","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-6PRX-MWVV","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-R6LQ-ZP8W","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD","newValue":"887761","oldValue":"887760"},{"claimRef":"RESH-B7L3-5PTA","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD","newValue":"887771","oldValue":"887770"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)

  const raisedBy = 'Admin2'

  //Data Change 1
  const update1 = datastoreUpdates[0]
  await updateClaimData({
    db,
    reference: update1.claimRef,
    updatedProperty: 'testResults',
    newValue: update1.newValue,
    oldValue: update1.oldValue,
    note: 'Requested change from Sally Harrison via email on 16th April 2026',
    user: raisedBy,
    updatedAt: new Date()
  })

  //Data Change 2
  await deleteClaim(db, datastoreUpdates[1].claimRef)

  //Data Change 3
  const update3 = datastoreUpdates[2]
  await updateClaimData({
    db,
    reference: update3.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update3.newValue,
    oldValue: update3.oldValue,
    note: 'Requested change from Sally Harrison via email on 16th April 2026',
    user: raisedBy,
    updatedAt: new Date()
  })

  //Data Change 4
  const update4 = datastoreUpdates[3]
  const herd = await getHerdById(db, update4.id)
  const oldValue = herd.cph
  await updateIsCurrentHerd(db, herd.id, false, herd.version)

  delete herd._id
  delete herd.createdAt
  delete herd.updatedAt
  delete herd.updatedBy
  delete herd.migratedRecord
  herd.createdBy = raisedBy
  herd.updatedAt = {}
  herd.version = herd.version + 1
  herd.cph = update4.cph
  await createHerd(db, herd)

  const claim = await getClaimByReference(db, update4.claimRef)
  const claimHerdData = claim.herd
  claimHerdData.version = herd.version
  claimHerdData.cph = herd.cph
  claimHerdData.associatedAt = new Date()

  await updateHerd({
    claimRef: update4.claimRef,
    newValue: update4.cph,
    oldValue,
    note: 'Requested change from Sally Harrison via email on 16th April 2026',
    createdBy: raisedBy,
    db,
    updatedProperty: 'herdCph',
    claimHerdData
  })
}

export const sendEvents = async (serviceVersion, { events }, db, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const withdrawnStatusId = 'WITHDRAWN'
  const withdrawnMessage = 'Claim has been updated'

  const herdAssociatedEvent = 'claim-herdAssociated'
  const herdAssociatedMessage = 'Herd associated with claim updated'

  //Data Change 1
  const event1 = events[0]
  const eventData1 = {
    applicationReference: event1.applicationRef,
    reference: event1.claimRef,
    newValue: event1.newValue,
    oldValue: event1.oldValue,
    updatedProperty: 'testResults',
    note: 'Requested change from Sally Harrison via email on 16th April 2026'
  }
  await claimDataUpdateEvent(eventData1, 'claim-testResults', raisedBy, new Date(), event1.sbi)

  //Data Change 2
  const event2 = events[1]
  await raiseClaimEvents(
    {
      claim: {
        id: uuid(),
        reference: event2.claimRef,
        applicationReference: event2.applicationRef,
        status: withdrawnStatusId
      },
      message: withdrawnMessage,
      raisedBy,
      raisedOn: new Date()
    },
    event2.sbi
  )

  //Data Change 3
  const event3 = events[2]
  const eventData3 = {
    applicationReference: event3.applicationRef,
    reference: event3.claimRef,
    newValue: event3.newValue,
    oldValue: event3.oldValue,
    updatedProperty: 'dateOfTesting',
    note: 'Requested change from Sally Harrison via email on 16th April 2026'
  }
  await claimDataUpdateEvent(eventData3, 'claim-dateOfTesting', raisedBy, new Date(), event3.sbi)

  //Data Change 4
  const event4 = events[3]

  const raisedOn = new Date()
  const raisedOn1 = new Date(raisedOn.getTime() + 1).toISOString()
  const raisedOn2 = new Date(raisedOn.getTime() + 2).toISOString()

  const herd = await getHerdById(db, event4.id)

  await raiseHerdEvent({
    sbi: event4.sbi,
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
      herdReasonManagementNeeds: true,
      herdReasonUniqueHealth: true,
      herdReasonDifferentBreed: false,
      herdReasonOtherPurpose: false,
      herdReasonKeptSeparate: false,
      herdReasonOnlyHerd: false,
      herdReasonOther: false
    }
  })
  await raiseHerdEvent({
    sbi: event4.sbi,
    message: herdAssociatedMessage,
    type: herdAssociatedEvent,
    raisedBy,
    raisedOn: raisedOn2,
    data: {
      herdId: herd.id,
      herdVersion: herd.version,
      reference: event4.claimRef,
      applicationReference: event4.applicationRef
    }
  })
}
