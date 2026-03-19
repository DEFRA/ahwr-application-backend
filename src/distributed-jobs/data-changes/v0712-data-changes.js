import { v4 as uuid } from 'uuid'
import { deleteClaim, updateClaimData } from '../../repositories/claim-repository.js'
import { raiseClaimEvents } from '../../event-publisher/index.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0712_DATA={"datastoreUpdates":[{"claimRef":"RESH-ZCPC-LXQZ"},{"claimRef":"RESH-XFD7-AD9W"},{"claimRef":"RESH-3UJR-ZR84"},{"claimRef":"RESH-QN69-YVH6","newValue":"999964","oldValue":"887764"},{"claimRef":"RESH-77DN-N9GS","newValue":"2025-11-18T00:00:00.000Z","oldValue":"2026-03-19T00:00:00.000Z"}],"events":[{"claimRef":"RESH-ZCPC-LXQZ","sbi":"168785858","applicationRef":"IAHW-7FYA-JW2M"},{"claimRef":"RESH-XFD7-AD9W","sbi":"168785858","applicationRef":"IAHW-7FYA-JW2M"},{"claimRef":"RESH-3UJR-ZR84","sbi":"168785858","applicationRef":"IAHW-7FYA-JW2M"},{"claimRef":"RESH-QN69-YVH6","sbi":"168785858","applicationRef":"IAHW-7FYA-JW2M","newValue":"999964","oldValue":"887764"},{"claimRef":"RESH-77DN-N9GS","sbi":"168785858","applicationRef":"IAHW-7FYA-JW2M","newValue":"2025-11-18T00:00:00.000Z","oldValue":"2026-03-19T00:00:00.000Z"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const updateNotes = 'Requested change from Samantha Smith via email on 10th March 2026'

  await deleteClaim(db, datastoreUpdates[0].claimRef)

  await deleteClaim(db, datastoreUpdates[1].claimRef)

  await deleteClaim(db, datastoreUpdates[2].claimRef)

  const update4 = datastoreUpdates[3]
  await updateClaimData({
    db,
    reference: update4.claimRef,
    updatedProperty: 'laboratoryURN',
    newValue: update4.newValue,
    oldValue: update4.oldValue,
    note: updateNotes,
    user: raisedBy,
    updatedAt: new Date()
  })

  const update5 = datastoreUpdates[4]
  await updateClaimData({
    db,
    reference: update5.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update5.newValue,
    oldValue: update5.oldValue,
    note: updateNotes,
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
  const updateNotes = 'Requested change from Samantha Smith via email on 10th March 2026'

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
  const eventData4 = {
    applicationReference: event4.applicationRef,
    reference: event4.claimRef,
    newValue: event4.newValue,
    oldValue: event4.oldValue,
    updatedProperty: 'urnResult',
    note: updateNotes
  }
  await claimDataUpdateEvent(eventData4, 'claim-urnResult', raisedBy, new Date(), event4.sbi)

  const event5 = events[4]
  const eventData5 = {
    applicationReference: event5.applicationRef,
    reference: event5.claimRef,
    newValue: event5.newValue,
    oldValue: event5.oldValue,
    updatedProperty: 'dateOfTesting',
    note: updateNotes
  }
  await claimDataUpdateEvent(eventData5, 'claim-dateOfTesting', raisedBy, new Date(), event5.sbi)
}
