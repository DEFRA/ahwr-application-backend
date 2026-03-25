import { v4 as uuid } from 'uuid'
import { deleteClaim, updateClaimData } from '../../repositories/claim-repository.js'
import { raiseClaimEvents } from '../../event-publisher/index.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0723_DATA={"datastoreUpdates":[{"claimRef":"RESH-YFE2-A4ZB"},{"claimRef":"RESH-9TBQ-E4TP"},{"claimRef":"RESH-4SUJ-BDWB"},{"claimRef":"RESH-6PRX-MWVV"},{"claimRef":"RESH-R6LQ-ZP8W","newValue":"887761","oldValue":"887760"},{"claimRef":"RESH-B7L3-5PTA","newValue":"887771","oldValue":"887770"}],"events":[{"claimRef":"RESH-YFE2-A4ZB","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-9TBQ-E4TP","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-4SUJ-BDWB","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-6PRX-MWVV","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD"},{"claimRef":"RESH-R6LQ-ZP8W","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD","newValue":"887761","oldValue":"887760"},{"claimRef":"RESH-B7L3-5PTA","sbi":"106440483","applicationRef":"IAHW-2DFD-0FAD","newValue":"887771","oldValue":"887770"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const updateNote = 'Requested change from Samantha Smith via email on 20th March 2026'
  const updatedProperty = 'laboratoryURN'

  await deleteClaim(db, datastoreUpdates[0].claimRef)
  await deleteClaim(db, datastoreUpdates[1].claimRef)
  await deleteClaim(db, datastoreUpdates[2].claimRef)
  await deleteClaim(db, datastoreUpdates[3].claimRef)

  const update5 = datastoreUpdates[4]
  await updateClaimData({
    db,
    reference: update5.claimRef,
    updatedProperty,
    newValue: update5.newValue,
    oldValue: update5.oldValue,
    note: updateNote,
    user: raisedBy,
    updatedAt: new Date()
  })
  const update6 = datastoreUpdates[5]
  await updateClaimData({
    db,
    reference: update6.claimRef,
    updatedProperty,
    newValue: update6.newValue,
    oldValue: update6.oldValue,
    note: updateNote,
    user: raisedBy,
    updatedAt: new Date()
  })
}

export const sendEvents = async (serviceVersion, { events }, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const withdrawnStatusId = 'WITHDRAWN'
  const withdrawnMessage = 'Claim has been updated'
  const updateNote = 'Requested change from Samantha Smith via email on 20th March 2026'
  const updatedProperty = 'urnResult'
  const type = 'claim-urnResult'

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
  const event3 = events[2]
  await raiseClaimEvents(
    {
      claim: {
        id: uuid(),
        reference: event3.claimRef,
        applicationReference: event3.applicationRef,
        status: withdrawnStatusId
      },
      message: withdrawnMessage,
      raisedBy,
      raisedOn: new Date()
    },
    event3.sbi
  )
  const event4 = events[3]
  await raiseClaimEvents(
    {
      claim: {
        id: uuid(),
        reference: event4.claimRef,
        applicationReference: event4.applicationRef,
        status: withdrawnStatusId
      },
      message: withdrawnMessage,
      raisedBy,
      raisedOn: new Date()
    },
    event4.sbi
  )

  const event5 = events[4]
  const eventData5 = {
    applicationReference: event5.applicationRef,
    reference: event5.claimRef,
    newValue: event5.newValue,
    oldValue: event5.oldValue,
    updatedProperty,
    note: updateNote
  }
  await claimDataUpdateEvent(eventData5, type, raisedBy, new Date(), event5.sbi)

  const event6 = events[5]
  const eventData6 = {
    applicationReference: event6.applicationRef,
    reference: event6.claimRef,
    newValue: event6.newValue,
    oldValue: event6.oldValue,
    updatedProperty,
    note: updateNote
  }
  await claimDataUpdateEvent(eventData6, type, raisedBy, new Date(), event6.sbi)
}
