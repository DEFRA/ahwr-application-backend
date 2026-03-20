import { updateClaimData } from '../../repositories/claim-repository.js'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event.js'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0721_DATA={"datastoreUpdates":[{"claimRef":"FUSH-MPSK-5DH3","newValue":"2025-03-04T00:00:00.000Z","oldValue":"2025-04-26T00:00:00.000Z"}],"events":[{"claimRef":"FUSH-MPSK-5DH3","sbi":"106308119","applicationRef":"IAHW-2E02-3601","newValue":"2025-03-04T00:00:00.000Z","oldValue":"2025-04-26T00:00:00.000Z"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)
  const update1 = datastoreUpdates[0]
  await updateClaimData({
    db,
    reference: update1.claimRef,
    updatedProperty: 'dateOfTesting',
    newValue: update1.newValue,
    oldValue: update1.oldValue,
    note: 'Requested change from Samantha Smith via email on 19th March 2026',
    user: 'Admin2',
    updatedAt: new Date()
  })
}

export const sendEvents = async (serviceVersion, { events }, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)
  const event1 = events[0]
  const eventData1 = {
    applicationReference: event1.applicationRef,
    reference: event1.claimRef,
    newValue: event1.newValue,
    oldValue: event1.oldValue,
    updatedProperty: 'dateOfTesting',
    note: 'Requested change from Samantha Smith via email on 19th March 2026'
  }
  await claimDataUpdateEvent(eventData1, 'claim-dateOfTesting', 'Admin2', new Date(), event1.sbi)
}
