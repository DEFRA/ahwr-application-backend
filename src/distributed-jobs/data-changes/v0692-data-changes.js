import { v4 as uuid } from 'uuid'
import { deleteClaim, updateClaimData } from '../../repositories/claim-repository.js'
import { raiseClaimEvents } from '../../event-publisher/index.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0692_DATA={"datastoreUpdates":[{"claimRef":"RESH-CM1C-KYJQ"},{"claimRef":"RESH-6755-4TUH"},{"claimRef":"RESH-2CGP-1EM9"},{"claimRef":"RESH-8GSD-BIZ5","newValue":"SH-0000-0000-4008-1","oldValue":"887764"}],"events":[{"sbi":"106746222","claimRef":"RESH-CM1C-KYJQ","applicationRef":"IAHW-GVJ6-33CY"},{"sbi":"106746222","claimRef":"RESH-6755-4TUH","applicationRef":"IAHW-GVJ6-33CY"},{"sbi":"106746222","claimRef":"RESH-2CGP-1EM9","applicationRef":"IAHW-GVJ6-33CY"},{"sbi":"106746222","claimRef":"RESH-8GSD-BIZ5","applicationRef":"IAHW-GVJ6-33CY","newValue":"SH-0000-0000-4008-1","oldValue":"887764"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)

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
    note: 'Requested change from Samantha Smith via email on 23rd February 2026',
    user: 'Admin2',
    updatedAt: new Date()
  })
}

export const sendEvents = async (serviceVersion, { events }, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  // common data across events
  const raisedBy = 'Admin2'
  const withdrawnStatusId = 'WITHDRAWN'
  const withdrawnMessage = 'Claim has been updated'

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
  const eventData = {
    applicationReference: event4.applicationRef,
    reference: event4.claimRef,
    newValue: event4.newValue,
    oldValue: event4.oldValue,
    updatedProperty: 'urnResult',
    note: 'Requested change from Samantha Smith via email on 23rd February 2026'
  }
  await claimDataUpdateEvent(eventData, 'claim-urnResult', 'Admin2', new Date(), event4.sbi)
}
