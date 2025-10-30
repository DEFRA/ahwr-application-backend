import { PublishEventBatch } from 'ffc-ahwr-common-library'
import { config } from '../config/config.js'
import { randomUUID } from 'node:crypto'

export const SEND_SESSION_EVENT = 'send-session-event'
export const APPLICATION_STATUS_EVENT = 'application-status-event'

const eventQueueConfig = config.get('azure.eventQueue')

export const raiseApplicationStatusEvent = async (event) => {
  const eventBatch = [
    {
      name: SEND_SESSION_EVENT,
      properties: {
        id: `${event.application.id}`,
        sbi: `${event.application.data.organisation.sbi}`,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: `application:status-updated:${event.application.statusId}`,
          message: event.message,
          data: {
            reference: event.application.reference,
            statusId: event.application.statusId
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ]
  // TODO: status history lives with application/claim now so we don;t need to emit anything elsewhere
  // Tidy this up when ensuring that is saved
  // if (config.storeHistoryInDb.enabled) {
  //   await createStatusHistory({
  //     reference: event.application.reference,
  //     statusId: event.application.statusId,
  //     note: event.note,
  //     createdAt: event.raisedOn.toISOString(),
  //     createdBy: event.raisedBy
  //   })
  // } else {
  //   eventBatch.unshift({
  //     name: APPLICATION_STATUS_EVENT,
  //     properties: {
  //       id: `${event.application.id}`,
  //       sbi: `${event.application.data.organisation.sbi}`,
  //       cph: 'n/a',
  //       checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
  //       status: 'success',
  //       action: {
  //         type: 'status-updated',
  //         message: event.message,
  //         data: {
  //           reference: event.application.reference,
  //           statusId: event.application.statusId,
  //           note: event.note
  //         },
  //         raisedBy: event.raisedBy,
  //         raisedOn: event.raisedOn.toISOString()
  //       }
  //     }
  //   })
  // }
  await new PublishEventBatch(eventQueueConfig).sendEvents(eventBatch)
}

export const raiseClaimEvents = async (event, sbi = 'none') => {
  const eventBatch = [
    {
      name: SEND_SESSION_EVENT,
      properties: {
        id: `${event.claim.id}`,
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: `application:status-updated:${event.claim.statusId}`,
          message: event.message,
          data: {
            reference: event.claim.reference,
            applicationReference: event.claim.applicationReference,
            statusId: event.claim.statusId
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ]

  // TODO: see above
  // if (config.storeHistoryInDb.enabled) {
  //   await createStatusHistory({
  //     reference: event.claim.reference,
  //     statusId: event.claim.statusId,
  //     note: event.note,
  //     createdAt: event.raisedOn.toISOString(),
  //     createdBy: event.raisedBy
  //   })
  // } else {
  //   eventBatch.unshift({
  //     name: APPLICATION_STATUS_EVENT,
  //     properties: {
  //       id: `${event.claim.id}`,
  //       sbi,
  //       cph: 'n/a',
  //       checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
  //       status: 'success',
  //       action: {
  //         type: 'status-updated',
  //         message: event.message,
  //         data: {
  //           reference: event.claim.reference,
  //           applicationReference: event.claim.applicationReference,
  //           statusId: event.claim.statusId,
  //           note: event.note
  //         },
  //         raisedBy: event.raisedBy,
  //         raisedOn: event.raisedOn.toISOString()
  //       }
  //     }
  //   })
  // }
  await new PublishEventBatch(eventQueueConfig).sendEvents(eventBatch)
}

export const raiseApplicationFlaggedEvent = async (event, sbi) => {
  await new PublishEventBatch(eventQueueConfig).sendEvents([
    {
      name: SEND_SESSION_EVENT,
      properties: {
        id: randomUUID(),
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: 'application-flagged',
          message: event.message,
          data: {
            flagId: event.flag.id,
            flagDetail: event.flag.note,
            flagAppliesToMh: event.flag.appliesToMh,
            applicationReference: event.application.id
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

export const raiseApplicationFlagDeletedEvent = async (event, sbi) => {
  await new PublishEventBatch(eventQueueConfig).sendEvents([
    {
      name: SEND_SESSION_EVENT,
      properties: {
        id: randomUUID(),
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: 'application-flag-deleted',
          message: event.message,
          data: {
            flagId: event.flag.id,
            flagAppliesToMh: event.flag.appliesToMh,
            deletedNote: event.flag.deletedNote,
            applicationReference: event.application.id
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

export const raiseHerdEvent = async ({ sbi, message, data, type }) => {
  await new PublishEventBatch(eventQueueConfig).sendEvents([
    {
      name: SEND_SESSION_EVENT,
      properties: {
        id: randomUUID(),
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type,
          message,
          data,
          raisedBy: 'admin',
          raisedOn: new Date().toISOString()
        }
      }
    }
  ])
}
