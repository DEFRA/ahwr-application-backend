import { deleteClaim } from '../../repositories/claim-repository.js'
import { raiseClaimEvents } from '../../event-publisher/index.js'
import { v4 as uuid } from 'uuid'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0692_DATA={"datastoreUpdates":[{"claimRef":"RESH-C2DZ-HPZR"}],"events":[{"sbi":"123456789","claimRef":"RESH-C2DZ-HPZR","applicationRef":"IAHW-8VE2-P6PA"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)

  await deleteClaim(db, datastoreUpdates[0].claimRef)

  await deleteClaim(db, datastoreUpdates[1].claimRef)

  await deleteClaim(db, datastoreUpdates[2].claimRef)

  // update URN
  // const update4 = datastoreUpdates[3]
  // const updatedBy = 'Admin2'
  // const updateNotes = 'Requested change from Samantha Smith via email on 23rd February 2026'
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
}
